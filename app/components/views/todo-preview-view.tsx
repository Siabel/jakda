"use client";

import { FormEvent, useState } from "react";
import { PageHeader } from "../common";
import { dateKey, displayDate } from "../ui-helpers";

type TodoStatus = "open" | "scheduled" | "done";
type Todo = {
  id: string;
  title: string;
  memo: string;
  priority: "먼저" | "보통" | "천천히";
  status: TodoStatus;
};

const initialTodos: Todo[] = [
  {
    id: "contact",
    title: "민지에게 안부 연락하기",
    memo: "시간이 정해진 약속은 아니지만 이번 주에는 꼭",
    priority: "먼저",
    status: "open",
  },
  {
    id: "checkup",
    title: "올해 건강검진 예약하기",
    memo: "검진 기관과 가능한 날짜 먼저 찾아보기",
    priority: "보통",
    status: "open",
  },
  {
    id: "book",
    title: "읽던 책 마지막 장 마무리",
    memo: "여유가 생기는 저녁에 30분",
    priority: "천천히",
    status: "scheduled",
  },
  {
    id: "desk",
    title: "책상 서랍 한 칸 정리",
    memo: "작게 시작한 일도 완료로 남기기",
    priority: "보통",
    status: "done",
  },
];

export function TodoPreviewView({
  onToast,
}: {
  onToast: (message: string) => void;
}) {
  const [todos, setTodos] = useState(initialTodos);
  const [filter, setFilter] = useState<TodoStatus>("open");
  const [draft, setDraft] = useState("");
  const [selectedId, setSelectedId] = useState("contact");
  const [scheduleDate, setScheduleDate] = useState(dateKey());
  const [scheduleTime, setScheduleTime] = useState("09:00");
  const visible = todos.filter((todo) => todo.status === filter);
  const selected =
    todos.find((todo) => todo.id === selectedId && todo.status !== "done") ??
    todos.find((todo) => todo.status === "open") ??
    null;
  const count = (status: TodoStatus) =>
    todos.filter((todo) => todo.status === status).length;

  const addTodo = (event: FormEvent) => {
    event.preventDefault();
    if (!draft.trim()) return;
    const item: Todo = {
      id: "preview-" + Date.now(),
      title: draft.trim(),
      memo: "방금 추가한 시안용 할 일이에요.",
      priority: "보통",
      status: "open",
    };
    setTodos((current) => [item, ...current]);
    setSelectedId(item.id);
    setFilter("open");
    setDraft("");
    onToast("화면 시안에만 할 일을 추가했어요");
  };

  const toggleDone = (todo: Todo) =>
    setTodos((current) =>
      current.map((item) =>
        item.id === todo.id
          ? { ...item, status: item.status === "done" ? "open" : "done" }
          : item,
      ),
    );

  const scheduleTodo = () => {
    if (!selected) return;
    setTodos((current) =>
      current.map((todo) =>
        todo.id === selected.id ? { ...todo, status: "scheduled" } : todo,
      ),
    );
    setFilter("scheduled");
    onToast("시안에서만 일정으로 옮겼어요. 실제 저장은 하지 않았어요");
  };

  return (
    <>
      <PageHeader
        eyebrow="날짜 없는 마음을 다음 행동으로"
        title="할 일 보관함"
        action={<span className="preview-badge">화면 시안 · 저장 안 됨</span>}
      />
      <section className="todo-preview-guide">
        <div>
          <small>TO-DO INBOX</small>
          <h2>언제 할지 몰라도, 잊고 싶지 않은 일을 모아두세요.</h2>
          <p>먼저 가볍게 적고, 마음이 정해지는 순간 일정으로 옮깁니다.</p>
        </div>
        <div className="todo-preview-flow">
          <span><b>1</b> 보관</span><i>→</i>
          <span><b>2</b> 시간 선택</span><i>→</i>
          <span><b>3</b> 하루에 기록</span>
        </div>
      </section>
      <div className="todo-preview-layout">
        <section className="todo-inbox-card">
          <div className="todo-card-heading">
            <div><small>나중을 위한 작은 목록</small><h2>할 일</h2></div>
            <strong>{count("open")}개 대기 중</strong>
          </div>
          <form className="todo-quick-add" onSubmit={addTodo}>
            <span>＋</span>
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="예: 올해 건강검진 예약하기"
              aria-label="새 할 일"
            />
            <button type="submit">담아두기</button>
          </form>
          <div className="todo-filters">
            {[
              ["open", "대기"],
              ["scheduled", "일정에 담음"],
              ["done", "완료"],
            ].map(([status, label]) => (
              <button
                type="button"
                className={filter === status ? "active" : ""}
                key={status}
                onClick={() => setFilter(status as TodoStatus)}
              >
                {label} <b>{count(status as TodoStatus)}</b>
              </button>
            ))}
          </div>
          <div className="todo-preview-list">
            {visible.map((todo) => (
              <article
                className={
                  "todo-preview-item " +
                  (selected?.id === todo.id ? "selected " : "") +
                  todo.status
                }
                key={todo.id}
              >
                <button
                  type="button"
                  className="todo-check"
                  aria-label={todo.title + " 완료 전환"}
                  onClick={() => toggleDone(todo)}
                >
                  {todo.status === "done" ? "✓" : ""}
                </button>
                <button
                  type="button"
                  className="todo-copy"
                  onClick={() => setSelectedId(todo.id)}
                >
                  <span>
                    <em>{todo.priority}</em>
                    {todo.status === "scheduled" ? <em>일정 연결</em> : null}
                  </span>
                  <b>{todo.title}</b>
                  <small>{todo.memo}</small>
                </button>
                {todo.status !== "done" ? (
                  <button
                    type="button"
                    className="todo-plan-button"
                    onClick={() => setSelectedId(todo.id)}
                  >
                    일정으로
                  </button>
                ) : null}
              </article>
            ))}
            {!visible.length ? (
              <div className="todo-preview-empty">
                <span>✓</span><b>이 목록은 비어 있어요.</b>
              </div>
            ) : null}
          </div>
        </section>
        <aside className="todo-schedule-preview">
          <div className="todo-card-heading">
            <div><small>SCHEDULE IT</small><h2>일정으로 잡기</h2></div>
            <span className="todo-drag-hint">드래그 연동 예정</span>
          </div>
          {selected ? (
            <>
              <div className="todo-selected-preview">
                <span>선택한 할 일</span>
                <b>{selected.title}</b>
                <small>{selected.memo}</small>
              </div>
              <div className="todo-schedule-fields">
                <label>
                  <span>언제 할까요?</span>
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={(event) => setScheduleDate(event.target.value)}
                  />
                </label>
                <label>
                  <span>시작 시간</span>
                  <input
                    type="time"
                    step="600"
                    value={scheduleTime}
                    onChange={(event) => setScheduleTime(event.target.value)}
                  />
                </label>
              </div>
              <div className="todo-calendar-preview">
                <small>{displayDate(scheduleDate, true)}</small>
                <div>
                  <time>{scheduleTime}</time>
                  <span><b>{selected.title}</b><small>할 일에서 가져온 일정</small></span>
                </div>
              </div>
              <button
                type="button"
                className="primary todo-schedule-action"
                onClick={scheduleTodo}
              >
                이 시간에 일정으로 담기
              </button>
              <p className="todo-preview-note">
                실제 기능에서는 일정 생성 후에도 원래 할 일과 연결합니다.
              </p>
            </>
          ) : (
            <div className="todo-preview-empty large">
              <span>↗</span><b>옮길 할 일을 선택해 주세요.</b>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
