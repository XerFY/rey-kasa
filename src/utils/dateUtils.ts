import type { DayEndRecord } from "../types/DayEndRecord";
import type { Transaction } from "../types/Transaction";

export function createDateKey(
  date: Date
): string {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getTransactionDateKey(
  transaction: Transaction
): string {
  return createDateKey(
    new Date(transaction.createdAt)
  );
}

export function findClosedDay(
  transaction: Transaction,
  dayEnds: DayEndRecord[]
): DayEndRecord | null {
  const transactionDateKey =
    getTransactionDateKey(transaction);

  return (
    dayEnds.find(
      (record) =>
        record.dateKey ===
        transactionDateKey
    ) ?? null
  );
}

export function isTransactionDayClosed(
  transaction: Transaction,
  dayEnds: DayEndRecord[]
): boolean {
  return (
    findClosedDay(
      transaction,
      dayEnds
    ) !== null
  );
}

export function formatDateKey(
  dateKey: string
): string {
  const [year, month, day] =
    dateKey.split("-");

  return `${day}.${month}.${year}`;
}