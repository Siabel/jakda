export type View =
  | "today"
  | "todo"
  | "calendar"
  | "ledger"
  | "stats"
  | "records"
  | "diary"
  | "profile"
  | "settings";
export type ScheduleStatus = "planned" | "done" | "partial" | "cancelled";
export type TransactionType = "income" | "expense";
export type RepeatFrequency = "yearly" | "monthly" | "weekly" | "daily";
export type TransactionSource = "manual" | "schedule_actual";
export type TodoStatus = "open" | "scheduled" | "done";
export type TodoPriority = "high" | "normal" | "low";

export type AppUser = {
  id: string;
  name: string;
  realName?: string;
  email: string;
  createdAt?: string;
  lastSignInAt?: string;
};

export type Schedule = {
  id: string;
  userId: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  actualDate: string;
  actualStartTime: string;
  actualEndTime: string;
  completedAt: string | null;
  place: string;
  address: string;
  people: string;
  expectedCost: number;
  status: ScheduleStatus;
  memo: string;
  isRecurring: boolean;
  repeatFrequency: RepeatFrequency | null;
  repeatEndDate: string | null;
  seriesId: string | null;
};

export type Transaction = {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  date: string;
  category: string;
  title: string;
  memo: string;
  source: TransactionSource;
  fixed: boolean;
  repeatFrequency: RepeatFrequency | null;
  repeatMonth: number | null;
  repeatDay: number | null;
  repeatEndDate: string | null;
  seriesId: string | null;
  scheduleId?: string;
};

export type EmotionEntry = {
  emotion: string;
  intensity: number;
};

export type EmotionDiary = {
  id: string;
  userId: string;
  date: string;
  emotions: EmotionEntry[];
  cause: string;
  note: string;
};

export type DailyRecord = {
  id: string;
  userId: string;
  date: string;
  time: string;
  title: string;
  content: string;
  scheduleId?: string;
};

export type Todo = {
  id: string;
  userId: string;
  title: string;
  memo: string;
  priority: TodoPriority;
  status: TodoStatus;
  scheduleId?: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AppData = {
  version: 3;
  user: AppUser;
  schedules: Schedule[];
  transactions: Transaction[];
  diaries: EmotionDiary[];
  dailyRecords: DailyRecord[];
  todos: Todo[];
  todoStorageReady: boolean;
};

export function emptyAppData(user: AppUser): AppData {
  return {
    version: 3,
    user,
    schedules: [],
    transactions: [],
    diaries: [],
    dailyRecords: [],
    todos: [],
    todoStorageReady: true,
  };
}
