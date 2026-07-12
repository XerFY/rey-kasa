import type { Transaction } from "./Transaction";

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "restore";

export type AuditLog = {
  id: string;
  action: AuditAction;
  transactionId: string;

  before: Transaction | null;
  after: Transaction | null;

  createdAt: number;
};