"use client";

import { DragEvent, FormEvent, useMemo, useRef, useState } from "react";
import type {
  Schedule,
  Todo,
  TodoPriority,
  TodoStatus,
} from "../../../lib/types";
import { PageHeader } from "../common";
import { dateKey, displayDate } from "../ui-helpers";

const filters: { status: TodoStatus; label: string }[] = [
  { status: "open", label: "대기" },
  { status: "scheduled", label: "일정에 담음" },
  { status: "done", label: "완료" },
];

const priorityLabels: Record<TodoPriority, string> = {
  high: "먼저",
  normal: "보통",
  low: "천천히",
};

type TodoViewProps = {
  todos: Todo[];
  schedules: Schedule[];
  storageReady: boolean;
  onCreate: (title: string) => Promise<Todo>;
  onUpdate: (todo: Todo) => Promise<void>;
  onDelete: (todo: Todo) => Promise<void>;
  onSchedule: (todo: Todo, date: string, startTime: string) => Promise<void>;
  onOpenSchedule: (schedule: Schedule) => void;
  onCompleteSchedule: (schedule: Schedule) => void;
  onToast: (message: string) => void;
};

export function TodoView({
  todos,
  schedules,
  storageReady,
  onCreate,
  onUpdate,
  onDelete,
  onSchedule,
  onOpenSchedule,
  onCompleteSchedule,
  onToast,
}: TodoViewProps) {
  const [filter, setFilter] = useState<TodoStatus>("open");
  const [draft, setDraft] = useState("");
  const initialTodo = todos.find((todo) => todo.status === "open") ?? todos[0];
  const [selectedId, setSelectedId] = useState(initialTodo?.id ?? "");
  const [scheduleDate, setScheduleDate] = useState(dateKey());
  const [scheduleTime, setScheduleTime] = useState("09:00");
  const [title, setTitle] = useState(initialTodo?.title ?? "");
  const [memo, setMemo] = useState(initialTodo?.memo ?? "");
  const [priority, setPriority] = useState<TodoPriority>(
    initialTodo?.priority ?? "normal",
  );
  const [saving, setSaving] = useState(false);
  const [dragging, setDragging] = useState(false);
  const schedulePanelRef = useRef<HTMLElement>(null);

  const visible = useMemo(
    () => todos.filter((todo) => todo.status === filter),
    [filter, todos],
  );
  const selected = todos.find((todo) => todo.id === selectedId) ?? null;
  const linkedSchedule = selected?.scheduleId
    ? (schedules.find((schedule) => schedule.id === selected.scheduleId) ??
      null)
    : null;
  const count = (status: TodoStatus) =>
    todos.filter((todo) => todo.status === status).length;

  const selectTodo = (todo: Todo) => {
    setSelectedId(todo.id);
    setTitle(todo.title);
    setMemo(todo.memo);
    setPriority(todo.priority);
  };

  const run = async (work: () => Promise<void>) => {
    if (!storageReady) {
      onToast("Supabase에 할 일 데이터베이스를 먼저 적용해 주세요");
      return;
    }
    setSaving(true);
    try {
      await work();
    } catch (error) {
      onToast(
        error instanceof Error ? error.message : "할 일을 저장하지 못했어요",
      );
    } finally {
      setSaving(false);
    }
  };

  const addTodo = (event: FormEvent) => {
    event.preventDefault();
    const value = draft.trim();
    if (!value) return;
    void run(async () => {
      const created = await onCreate(value);
      selectTodo(created);
      setDraft("");
      setFilter("open");
    });
  };

  const saveDetails = () => {
    if (!selected || !title.trim())
      return onToast("할 일 이름을 입력해 주세요");
    void run(() =>
      onUpdate({
        ...selected,
        title: title.trim(),
        memo: memo.trim(),
        priority,
        updatedAt: new Date().toISOString(),
      }),
    );
  };

  const toggleDone = (todo: Todo) => {
    const schedule = todo.scheduleId
      ? schedules.find((item) => item.id === todo.scheduleId)
      : undefined;
    if (schedule) {
      if (todo.status === "done") {
        onToast("연결된 일정의 완료 상태에서 확인해 주세요");
        onOpenSchedule(schedule);
      } else {
        onCompleteSchedule(schedule);
      }
      return;
    }
    const done = todo.status !== "done";
    void run(() =>
      onUpdate({
        ...todo,
        status: done ? "done" : todo.scheduleId ? "scheduled" : "open",
        completedAt: done ? new Date().toISOString() : null,
        updatedAt: new Date().toISOString(),
      }),
    );
  };

  const planTodo = (todo: Todo) => {
    const schedule = todo.scheduleId
      ? schedules.find((item) => item.id === todo.scheduleId)
      : undefined;
    selectTodo(todo);
    if (schedule) {
      onOpenSchedule(schedule);
      return;
    }
    window.setTimeout(
      () => schedulePanelRef.current?.scrollIntoView({ behavior: "smooth" }),
      0,
    );
  };

  const deleteSelected = () => {
    if (!selected || !window.confirm(`“${selected.title}” 할 일을 삭제할까요?`))
      return;
    void run(async () => {
      await onDelete(selected);
      const next = todos.find((todo) => todo.id !== selected.id);
      if (next) selectTodo(next);
      else {
        setSelectedId("");
        setTitle("");
        setMemo("");
        setPriority("normal");
      }
    });
  };

  const scheduleSelected = () => {
    if (!selected || selected.status === "done") return;
    void run(async () => {
      await onSchedule(selected, scheduleDate, scheduleTime);
      setFilter("scheduled");
    });
  };

  const dropTodo = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    setDragging(false);
    const id = event.dataTransfer.getData("text/todo-id");
    const dropped = todos.find((todo) => todo.id === id);
    if (dropped) selectTodo(dropped);
  };

  return (
    <>
      <PageHeader
        eyebrow="날짜 없는 마음을 다음 행동으로"
        title="할 일 보관함"
      />
      {!storageReady ? (
        <section className="todo-setup-alert" role="status">
          <b>할 일 저장 준비가 한 단계 남았어요.</b>
          <span>
            Supabase SQL Editor에서 <code>002_add_todos.sql</code>을 실행하면 이
            화면의 저장 기능이 활성화됩니다.
          </span>
        </section>
      ) : null}
      <section className="todo-guide">
        <div>
          <small>TO-DO INBOX</small>
          <h2>언제 할지 몰라도, 잊고 싶지 않은 일을 모아두세요.</h2>
          <p>먼저 가볍게 적고, 마음이 정해지는 순간 일정으로 옮깁니다.</p>
        </div>
        <div className="todo-flow" aria-label="할 일 사용 흐름">
          <span>
            <b>1</b> 보관
          </span>
          <i>→</i>
          <span>
            <b>2</b> 시간 선택
          </span>
          <i>→</i>
          <span>
            <b>3</b> 하루에 기록
          </span>
        </div>
      </section>
      <div className="todo-layout">
        <section className="todo-inbox-card">
          <div className="todo-card-heading">
            <div>
              <small>나중을 위한 작은 목록</small>
              <h2>할 일</h2>
            </div>
            <strong>{count("open")}개 대기 중</strong>
          </div>
          <form className="todo-quick-add" onSubmit={addTodo}>
            <span aria-hidden="true">＋</span>
            <input
              value={draft}
              maxLength={120}
              disabled={!storageReady || saving}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="예: 올해 건강검진 예약하기"
              aria-label="새 할 일"
            />
            <button type="submit" disabled={!storageReady || saving}>
              담아두기
            </button>
          </form>
          <div className="todo-filters">
            {filters.map(({ status, label }) => (
              <button
                type="button"
                className={filter === status ? "active" : ""}
                key={status}
                onClick={() => setFilter(status)}
              >
                {label} <b>{count(status)}</b>
              </button>
            ))}
          </div>
          <div className="todo-list">
            {visible.map((todo) => (
              <article
                className={`todo-item ${selected?.id === todo.id ? "selected " : ""}${todo.status}`}
                key={todo.id}
                draggable={todo.status === "open"}
                onDragStart={(event) => {
                  event.dataTransfer.setData("text/todo-id", todo.id);
                  event.dataTransfer.effectAllowed = "move";
                }}
              >
                <button
                  type="button"
                  className="todo-check"
                  aria-label={`${todo.title} 완료 전환`}
                  disabled={saving}
                  onClick={() => toggleDone(todo)}
                >
                  {todo.status === "done" ? "✓" : ""}
                </button>
                <button
                  type="button"
                  className="todo-copy"
                  onClick={() => selectTodo(todo)}
                >
                  <span>
                    <em>{priorityLabels[todo.priority]}</em>
                    {todo.status === "scheduled" ? <em>일정 연결</em> : null}
                  </span>
                  <b>{todo.title}</b>
                  <small>{todo.memo || "메모 없음"}</small>
                </button>
                {todo.status !== "done" ? (
                  <button
                    type="button"
                    className="todo-plan-button"
                    onClick={() => planTodo(todo)}
                  >
                    {todo.status === "scheduled" ? "일정 보기" : "일정으로"}
                  </button>
                ) : null}
              </article>
            ))}
            {!visible.length ? (
              <div className="todo-empty">
                <span>✓</span>
                <b>이 목록은 비어 있어요.</b>
              </div>
            ) : null}
          </div>
        </section>
        <aside
          ref={schedulePanelRef}
          className={`todo-schedule-panel ${dragging ? "dragging" : ""}`}
          onDragEnter={() => setDragging(true)}
          onDragLeave={() => setDragging(false)}
          onDragOver={(event) => event.preventDefault()}
          onDrop={dropTodo}
        >
          <div className="todo-card-heading">
            <div>
              <small>DETAIL &amp; SCHEDULE</small>
              <h2>정리하고 일정으로</h2>
            </div>
            <span className="todo-drag-hint">여기로 끌어오기</span>
          </div>
          {selected ? (
            <>
              <div className="todo-editor">
                <label>
                  <span>할 일</span>
                  <input
                    value={title}
                    maxLength={120}
                    onChange={(event) => setTitle(event.target.value)}
                  />
                </label>
                <label>
                  <span>메모</span>
                  <textarea
                    value={memo}
                    maxLength={500}
                    rows={3}
                    onChange={(event) => setMemo(event.target.value)}
                  />
                </label>
                <label>
                  <span>우선순위</span>
                  <select
                    value={priority}
                    onChange={(event) =>
                      setPriority(event.target.value as TodoPriority)
                    }
                  >
                    <option value="high">먼저</option>
                    <option value="normal">보통</option>
                    <option value="low">천천히</option>
                  </select>
                </label>
                <div className="todo-editor-actions">
                  <button
                    type="button"
                    className="ghost"
                    disabled={saving}
                    onClick={deleteSelected}
                  >
                    삭제
                  </button>
                  <button
                    type="button"
                    className="secondary"
                    disabled={saving}
                    onClick={saveDetails}
                  >
                    내용 저장
                  </button>
                </div>
              </div>
              {linkedSchedule ? (
                <div className="todo-linked-schedule">
                  <span>연결된 일정</span>
                  <b>{displayDate(linkedSchedule.date, true)}</b>
                  <small>
                    {linkedSchedule.startTime} · {linkedSchedule.title}
                  </small>
                  <button
                    type="button"
                    className="primary"
                    onClick={() => onOpenSchedule(linkedSchedule)}
                  >
                    일정 열기
                  </button>
                </div>
              ) : selected.status === "done" ? (
                <p className="todo-note">
                  완료한 할 일이에요. 다시 대기로 돌리면 일정을 잡을 수 있어요.
                </p>
              ) : (
                <>
                  <div className="todo-schedule-fields">
                    <label>
                      <span>언제 할까요?</span>
                      <input
                        type="date"
                        value={scheduleDate}
                        onChange={(event) =>
                          setScheduleDate(event.target.value)
                        }
                      />
                    </label>
                    <label>
                      <span>시작 시간</span>
                      <input
                        type="time"
                        step="600"
                        max="22:50"
                        value={scheduleTime}
                        onChange={(event) =>
                          setScheduleTime(event.target.value)
                        }
                      />
                    </label>
                  </div>
                  <div className="todo-calendar-card">
                    <small>{displayDate(scheduleDate, true)}</small>
                    <div>
                      <time>{scheduleTime}</time>
                      <span>
                        <b>{selected.title}</b>
                        <small>할 일에서 가져온 일정</small>
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="primary todo-schedule-action"
                    disabled={saving || !storageReady}
                    onClick={scheduleSelected}
                  >
                    이 시간에 일정으로 담기
                  </button>
                  <p className="todo-note">
                    일정으로 옮겨도 원래 할 일과 연결되어 완료 여부를
                    이어갑니다.
                  </p>
                </>
              )}
            </>
          ) : (
            <div className="todo-empty large">
              <span>↗</span>
              <b>정리할 할 일을 선택해 주세요.</b>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
