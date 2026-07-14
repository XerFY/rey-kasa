import {
  doc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";

import { auth, db } from "../firebase";

import type {
  PrintJobPayload,
  QueueTransactionPrintResult,
} from "../types/PrintJob";
import type { Transaction } from "../types/Transaction";

const PRINTER_ID = "koddata-kdp95" as const;

type QueueTransactionPrintParams = {
  transaction: Transaction;
  currentBalance: number;
  storeTitle: string;
  thankYouMessage: string;
};

function requiredText(
  value: string,
  fallback: string
): string {
  const normalized = value.trim();

  return normalized || fallback;
}

function validatePrintSnapshot({
  transaction,
  currentBalance,
}: Pick<
  QueueTransactionPrintParams,
  "transaction" | "currentBalance"
>): void {
  if (!transaction.id) {
    throw new Error(
      "İşlem kimliği bulunamadı."
    );
  }

  if (
    !Number.isFinite(transaction.createdAt) ||
    transaction.createdAt <= 0
  ) {
    throw new Error(
      "İşlem tarihi geçersiz."
    );
  }

  if (
    !Number.isFinite(transaction.amount) ||
    transaction.amount <= 0
  ) {
    throw new Error(
      "İşlem tutarı geçersiz."
    );
  }

  if (!Number.isFinite(currentBalance)) {
    throw new Error(
      "Güncel kasa bilgisi geçersiz."
    );
  }
}

export async function queueTransactionPrint({
  transaction,
  currentBalance,
  storeTitle,
  thankYouMessage,
}: QueueTransactionPrintParams): Promise<QueueTransactionPrintResult> {
  validatePrintSnapshot({
    transaction,
    currentBalance,
  });

  const createdBy = auth.currentUser?.uid;

  if (!createdBy) {
    throw new Error(
      "Yazdırma için Firebase bağlantısı hazır değil."
    );
  }

  const jobId = transaction.id;
  const jobReference = doc(
    db,
    "printJobs",
    jobId
  );
  const creationLogReference = doc(
    db,
    "printLogs",
    `job-created-${jobId}`
  );

  const payload: PrintJobPayload =
    Object.freeze({
      storeTitle: requiredText(
        storeTitle,
        "REY KASA"
      ),
      occurredAt: transaction.createdAt,
      transactionType: transaction.type,
      description: requiredText(
        transaction.description,
        "İşlem"
      ),
      amount: transaction.amount,
      currentBalance,
      thankYouMessage: requiredText(
        thankYouMessage,
        "İyi çalışmalar"
      ),
    });

  const created = await runTransaction(
    db,
    async (firestoreTransaction) => {
      const existingJob =
        await firestoreTransaction.get(
          jobReference
        );

      if (existingJob.exists()) {
        return false;
      }

      firestoreTransaction.set(
        jobReference,
        {
          transactionId: jobId,
          printerId: PRINTER_ID,
          copies: 1,
          payload,
          status: "pending",
          attemptCount: 0,
          createdAt: serverTimestamp(),
          claimedAt: null,
          claimedBy: null,
          deliveryOutcome: "not_started",
          printedAt: null,
          lastError: "",
          createdBy,
        }
      );

      firestoreTransaction.set(
        creationLogReference,
        {
          event: "job-created",
          jobId,
          transactionId: jobId,
          machineId: "pwa",
          printerId: PRINTER_ID,
          attemptCount: 0,
          message:
            "Yazdırma işi PWA tarafından oluşturuldu.",
          timestamp: serverTimestamp(),
          createdBy,
        }
      );

      return true;
    }
  );

  return {
    jobId,
    created,
  };
}
