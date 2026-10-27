import type { Dispatch, SetStateAction } from "react";
import {
  removeSchedule,
  removeTodo,
  upsertSchedule,
  upsertTodo,
} from "../../lib/app-data";
import {
  createScheduleFromTodo,
  createTodoItem,
  linkTodoToSchedule,
  replaceTodo,
} from "../../lib/todo-domain";
import type { AppData, Todo } from "../../lib/types";
import { newId } from "../components/ui-helpers";

type TodoActionsOptions = {
  data: AppData | null;
  setData: Dispatch<SetStateAction<AppData | null>>;
  setToast: Dispatch<SetStateAction<string>>;
  onDateChange: (date: string) => void;
};

export function createTodoActions({
  data,
  setData,
  setToast,
  onDateChange,
}: TodoActionsOptions) {
  const createTodo = async (title: string) => {
    if (!data?.todoStorageReady)
      throw new Error("할 일 데이터베이스 설정이 필요해요");
    const item = createTodoItem(
      title,
      data.user.id,
      newId(),
      new Date().toISOString(),
    );
    await upsertTodo(item);
    setData((previous) =>
      previous ? { ...previous, todos: [item, ...previous.todos] } : previous,
    );
    setToast("할 일을 보관함에 담았어요");
    return item;
  };

  const updateTodo = async (item: Todo) => {
    await upsertTodo(item);
    setData((previous) =>
      previous
        ? { ...previous, todos: replaceTodo(previous.todos, item) }
        : previous,
    );
    setToast(
      item.status === "done" ? "할 일을 완료했어요" : "할 일을 저장했어요",
    );
  };

  const deleteTodo = async (item: Todo) => {
    await removeTodo(item.id);
    setData((previous) =>
      previous
        ? {
            ...previous,
            todos: previous.todos.filter((todo) => todo.id !== item.id),
          }
        : previous,
    );
    setToast("할 일을 삭제했어요. 연결된 일정은 유지돼요");
  };

  const scheduleTodo = async (todo: Todo, date: string, startTime: string) => {
    const schedule = createScheduleFromTodo(todo, date, startTime, newId());
    const updatedTodo = linkTodoToSchedule(
      todo,
      schedule.id,
      new Date().toISOString(),
    );
    await upsertSchedule(schedule);
    try {
      await upsertTodo(updatedTodo);
    } catch (error) {
      await removeSchedule(schedule.id);
      throw error;
    }
    setData((previous) =>
      previous
        ? {
            ...previous,
            schedules: [...previous.schedules, schedule],
            todos: replaceTodo(previous.todos, updatedTodo),
          }
        : previous,
    );
    onDateChange(date);
    setToast("할 일을 일정으로 옮겼어요");
  };

  return { createTodo, updateTodo, deleteTodo, scheduleTodo };
}
