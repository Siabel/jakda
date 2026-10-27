import type { Schedule, Todo } from "./types";

export function createTodoItem(
  title: string,
  userId: string,
  id: string,
  now: string,
): Todo {
  return {
    id,
    userId,
    title: title.trim(),
    memo: "",
    priority: "normal",
    status: "open",
    completedAt: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function oneHourAfter(time: string) {
  const [hour, minute] = time.split(":").map(Number);
  const total = Math.min(hour * 60 + minute + 60, 23 * 60 + 50);
  const nextHour = Math.floor(total / 60)
    .toString()
    .padStart(2, "0");
  const nextMinute = (total % 60).toString().padStart(2, "0");
  return `${nextHour}:${nextMinute}`;
}

export function createScheduleFromTodo(
  todo: Todo,
  date: string,
  startTime: string,
  id: string,
): Schedule {
  if (startTime > "22:50")
    throw new Error("일정 시작 시간은 오후 10시 50분 이전으로 선택해 주세요");
  const endTime = oneHourAfter(startTime);
  if (endTime <= startTime)
    throw new Error("일정 시작 시간은 오후 10시 50분 이전으로 선택해 주세요");
  return {
    id,
    userId: todo.userId,
    title: todo.title,
    date,
    startTime,
    endTime,
    actualDate: "",
    actualStartTime: "",
    actualEndTime: "",
    completedAt: null,
    place: "",
    address: "",
    people: "",
    expectedCost: 0,
    status: "planned",
    memo: todo.memo,
    isRecurring: false,
    repeatFrequency: null,
    repeatEndDate: null,
    seriesId: null,
  };
}

export function linkTodoToSchedule(
  todo: Todo,
  scheduleId: string,
  updatedAt: string,
): Todo {
  return {
    ...todo,
    status: "scheduled",
    scheduleId,
    completedAt: null,
    updatedAt,
  };
}

export function completeTodoItem(todo: Todo, completedAt: string): Todo {
  return {
    ...todo,
    status: "done",
    completedAt,
    updatedAt: completedAt,
  };
}

export function unlinkTodoFromSchedule(todo: Todo, updatedAt: string): Todo {
  return {
    ...todo,
    status: todo.status === "scheduled" ? "open" : todo.status,
    scheduleId: undefined,
    completedAt: todo.status === "done" ? todo.completedAt : null,
    updatedAt,
  };
}

export function replaceTodo(items: Todo[], replacement: Todo) {
  return items.map((item) => (item.id === replacement.id ? replacement : item));
}
