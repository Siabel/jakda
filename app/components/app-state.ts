import type {
  AppData,
  DailyRecord,
  Schedule,
  Transaction,
} from "../../lib/types";
import { expenseCategories, pad } from "./ui-helpers";

export const createBlankSchedule = (
  date: string,
  userId: string,
): Schedule => ({
  id: "",
  userId,
  title: "",
  date,
  startTime: "09:00",
  endTime: "10:00",
  place: "",
  address: "",
  actualDate: "",
  actualStartTime: "",
  actualEndTime: "",
  completedAt: null,
  people: "",
  expectedCost: 0,
  status: "planned",
  memo: "",
  isRecurring: false,
  repeatFrequency: null,
  repeatEndDate: null,
  seriesId: null,
});

export const createBlankTransaction = (
  date: string,
  userId: string,
): Transaction => ({
  id: "",
  userId,
  type: "expense",
  amount: 0,
  date,
  category: expenseCategories[0],
  title: "",
  memo: "",
  source: "manual",
  fixed: false,
  repeatFrequency: null,
  repeatMonth: null,
  repeatDay: null,
  repeatEndDate: null,
  seriesId: null,
});

export const createBlankRecord = (
  date: string,
  userId: string,
): DailyRecord => ({
  id: "",
  userId,
  date,
  time: new Date().toTimeString().slice(0, 5),
  title: "",
  content: "",
});

export function selectDayData(data: AppData | null, date: string) {
  return {
    schedules: [...(data?.schedules ?? [])]
      .filter((schedule) => schedule.date === date)
      .sort((left, right) => left.startTime.localeCompare(right.startTime)),
    transactions: (data?.transactions ?? []).filter(
      (transaction) => transaction.date === date,
    ),
    records: [...(data?.dailyRecords ?? [])]
      .filter((record) => record.date === date)
      .sort((left, right) => right.time.localeCompare(left.time)),
    diary: data?.diaries.find((diary) => diary.date === date),
  };
}

export function selectMonthData(data: AppData | null, cursor: Date) {
  const monthKey = `${cursor.getFullYear()}-${pad(cursor.getMonth() + 1)}`;
  const transactions = (data?.transactions ?? []).filter((transaction) =>
    transaction.date.startsWith(monthKey),
  );
  const schedules = (data?.schedules ?? []).filter((schedule) =>
    schedule.date.startsWith(monthKey),
  );
  const actualScheduleIds = new Set(
    transactions
      .filter(
        (transaction) =>
          transaction.source === "schedule_actual" && transaction.scheduleId,
      )
      .map((transaction) => transaction.scheduleId),
  );

  return {
    monthKey,
    transactions,
    schedules,
    income: transactions
      .filter((transaction) => transaction.type === "income")
      .reduce((sum, transaction) => sum + transaction.amount, 0),
    expense: transactions
      .filter((transaction) => transaction.type === "expense")
      .reduce((sum, transaction) => sum + transaction.amount, 0),
    expected: schedules
      .filter(
        (schedule) =>
          schedule.status !== "cancelled" &&
          !actualScheduleIds.has(schedule.id),
      )
      .reduce((sum, schedule) => sum + schedule.expectedCost, 0),
  };
}
