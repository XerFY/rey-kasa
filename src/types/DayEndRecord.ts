import type { Transaction } from "./Transaction";

export type DayEndRecord = {
  id: string;
  dateKey: string;
  closedAt: number;

  totalIncome: number;
  totalExpense: number;
  netTotal: number;
  balance: number;

  transactionCount: number;
  transactions: Transaction[];
};