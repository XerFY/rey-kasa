import type { Timestamp } from "firebase/firestore";

export type PrintJobStatus =
  | "pending"
  | "printing"
  | "printed"
  | "failed"
  | "cancelled";

export type PrintDeliveryOutcome =
  | "not_started"
  | "unknown"
  | "spool_accepted";

export type PrintJobPayload = Readonly<{
  storeTitle: string;
  occurredAt: number;
  transactionType: "income" | "expense";
  description: string;
  amount: number;
  currentBalance: number;
  thankYouMessage: string;
}>;

export type PrintJob = {
  transactionId: string;
  printerId: "koddata-kdp95";
  copies: 1;
  payload: PrintJobPayload;
  status: PrintJobStatus;
  attemptCount: number;
  createdAt: Timestamp;
  claimedAt: Timestamp | null;
  claimedBy: string | null;
  claimToken?: string;
  dispatchStartedAt?: Timestamp;
  deliveryOutcome?: PrintDeliveryOutcome;
  printedAt: Timestamp | null;
  spoolerJobId?: number;
  lastError: string;
  mayHavePrinted?: boolean;
  createdBy: string;
};

export type QueueTransactionPrintResult = {
  jobId: string;
  created: boolean;
};
