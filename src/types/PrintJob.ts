import type { Transaction } from "./Transaction";

export type PrintJobStatus =
  | "pending"
  | "printing"
  | "printed"
  | "failed";

export type PrintJob = {
  id: string;
  type: "dayEnd" | "test";

  status: PrintJobStatus;

  transactions: Transaction[];
  balance: number;

  createdAt: number;
  printedAt: number | null;

  attemptCount: number;
  lastError: string;
};