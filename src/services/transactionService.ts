import {
  signInAnonymously,
} from "firebase/auth";

import {
  addDoc,
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  writeBatch,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from "firebase/firestore";

import {
  auth,
  db,
} from "../firebase";

import {
  rebuildClosedDay,
} from "./dayEndService";

import type {
  AuditAction,
  AuditLog,
} from "../types/AuditLog";

import type {
  Transaction,
} from "../types/Transaction";

import type {
  DayEndRecord,
} from "../types/DayEndRecord";

import {
  createDateKey,
} from "../utils/dateUtils";

export type CashMutationContext = {
  transactions: Transaction[];
  dayEnds: DayEndRecord[];
  openingBalance: number;
};

const transactionsCollection =
  collection(
    db,
    "transactions"
  );

const auditLogsCollection =
  collection(
    db,
    "auditLogs"
  );

let authenticationPromise:
  Promise<void> | null = null;

async function ensureAuthenticated():
  Promise<void> {
  if (auth.currentUser) {
    return;
  }

  if (!authenticationPromise) {
    authenticationPromise =
      signInAnonymously(auth)
        .then(() => undefined)
        .finally(() => {
          authenticationPromise = null;
        });
  }

  await authenticationPromise;
}

function mapTransaction(
  document:
    QueryDocumentSnapshot<DocumentData>
): Transaction {
  const data =
    document.data();

  return {
    id: document.id,

    type:
      data.type === "expense"
        ? "expense"
        : "income",

    amount:
      typeof data.amount ===
        "number"
        ? data.amount
        : 0,

    description:
      typeof data.description ===
        "string"
        ? data.description
        : "",

    createdAt:
      typeof data.createdAt ===
        "number"
        ? data.createdAt
        : Date.now(),
  };
}

async function writeAuditLog(
  action: AuditAction,
  transactionId: string,
  before: Transaction | null,
  after: Transaction | null
): Promise<void> {
  try {
    await addDoc(
      auditLogsCollection,
      {
        action,
        transactionId,
        before,
        after,
        createdAt: Date.now(),
      }
    );
  } catch (error) {
    // Geçmiş kaydı başarısız olsa bile
    // asıl kasa işlemi iptal edilmez.
    console.warn(
      "İşlem geçmişi kaydedilemedi:",
      error
    );
  }
}

async function commitCashMutation(
  context: CashMutationContext,
  before: Transaction | null,
  after: Transaction | null,
  mutate: (
    batch: ReturnType<typeof writeBatch>
  ) => void
): Promise<void> {
  const changedTransaction =
    after ?? before;

  if (!changedTransaction) {
    throw new Error(
      "Değiştirilecek kasa işlemi bulunamadı."
    );
  }

  const nextTransactions = [
    ...context.transactions.filter(
      (transaction) =>
        transaction.id !== before?.id &&
        transaction.id !== after?.id
    ),
    ...(after ? [after] : []),
  ];

  const changedDateKey =
    createDateKey(
      new Date(
        changedTransaction.createdAt
      )
    );

  const affectedDayEnds =
    context.dayEnds.filter(
      (record) =>
        record.dateKey >= changedDateKey
    );

  // Firestore batch sınırı 500 yazmadır.
  // Bir yazma ana kasa işlemi için ayrılır.
  if (affectedDayEnds.length > 499) {
    throw new Error(
      "Bu eski işlem tek seferde güncellenemeyecek kadar çok gün sonunu etkiliyor."
    );
  }

  const batch = writeBatch(db);

  mutate(batch);

  affectedDayEnds.forEach(
    (record) => {
      batch.set(
        doc(
          db,
          "dayEnds",
          record.id
        ),
        rebuildClosedDay(
          record,
          nextTransactions,
          context.openingBalance
        )
      );
    }
  );

  await batch.commit();
}

export async function connectFirebase():
  Promise<void> {
  await ensureAuthenticated();
}

export function listenTransactions(
  onData: (
    transactions: Transaction[],
    hasPendingWrites: boolean
  ) => void,

  onError: (
    error: Error
  ) => void
): Unsubscribe {
  const transactionsQuery =
    query(
      transactionsCollection,
      orderBy(
        "createdAt",
        "desc"
      )
    );

  return onSnapshot(
    transactionsQuery,
    {
      includeMetadataChanges:
        true,
    },
    (snapshot) => {
      const transactions =
        snapshot.docs.map(
          mapTransaction
        );

      const hasPendingWrites =
        snapshot.docs.some(
          (document) =>
            document.metadata
              .hasPendingWrites
        );

      onData(
        transactions,
        hasPendingWrites
      );
    },
    onError
  );
}

export async function createTransaction(
  transaction:
    Omit<Transaction, "id">,
  context: CashMutationContext
): Promise<void> {
  await ensureAuthenticated();

  const transactionDocument =
    doc(
      transactionsCollection
    );

  const newTransaction:
    Transaction = {
      id:
        transactionDocument.id,

      ...transaction,
    };

  await commitCashMutation(
    context,
    null,
    newTransaction,
    (batch) => {
      batch.set(
        transactionDocument,
        transaction
      );
    }
  );

  // Geçmiş kaydı kasa kaydını
  // engellemeden ayrı gönderilir.
  void writeAuditLog(
    "create",
    transactionDocument.id,
    null,
    newTransaction
  );
}

export async function updateTransaction(
  id: string,

  changes: Pick<
    Transaction,
    | "type"
    | "amount"
    | "description"
  >,

  suppliedBefore: Transaction,
  context: CashMutationContext
): Promise<void> {
  await ensureAuthenticated();

  const transactionDocument =
    doc(
      db,
      "transactions",
      id
    );

  const before = suppliedBefore;

  const after: Transaction = {
            ...before,

            type:
              changes.type,

            amount:
              changes.amount,

            description:
              changes.description,
          };

  await commitCashMutation(
    context,
    before,
    after,
    (batch) => {
      batch.update(
        transactionDocument,
        {
          type: changes.type,
          amount: changes.amount,
          description:
            changes.description,
        }
      );
    }
  );

  void writeAuditLog(
    "update",
    id,
    before,
    after
  );
}

export async function deleteTransaction(
  id: string,
  suppliedBefore: Transaction,
  context: CashMutationContext
): Promise<Transaction | null> {
  await ensureAuthenticated();

  const transactionDocument =
    doc(
      db,
      "transactions",
      id
    );

  const before = suppliedBefore;

  await commitCashMutation(
    context,
    before,
    null,
    (batch) => {
      batch.delete(
        transactionDocument
      );
    }
  );

  void writeAuditLog(
    "delete",
    id,
    before,
    null
  );

  return before;
}

export async function restoreTransaction(
  transaction: Transaction,
  context: CashMutationContext
): Promise<void> {
  await ensureAuthenticated();

  const transactionDocument =
    doc(
      db,
      "transactions",
      transaction.id
    );

  await commitCashMutation(
    context,
    null,
    transaction,
    (batch) => {
      batch.set(
        transactionDocument,
        {
          type: transaction.type,
          amount: transaction.amount,
          description:
            transaction.description,
          createdAt:
            transaction.createdAt,
        }
      );
    }
  );

  void writeAuditLog(
    "restore",
    transaction.id,
    null,
    transaction
  );
}

export function listenAuditLogs(
  onData: (
    logs: AuditLog[]
  ) => void,

  onError: (
    error: Error
  ) => void,

  maximumRecordCount = 100
): Unsubscribe {
  const auditQuery =
    query(
      auditLogsCollection,

      orderBy(
        "createdAt",
        "desc"
      ),

      limit(
        maximumRecordCount
      )
    );

  return onSnapshot(
    auditQuery,
    (snapshot) => {
      const logs =
        snapshot.docs.map(
          (document) => {
            const data =
              document.data();

            const action:
              AuditAction =
                data.action ===
                  "update" ||
                data.action ===
                  "delete" ||
                data.action ===
                  "restore"
                  ? data.action
                  : "create";

            return {
              id:
                document.id,

              action,

              transactionId:
                typeof data.transactionId ===
                  "string"
                  ? data.transactionId
                  : "",

              before:
                data.before ??
                null,

              after:
                data.after ??
                null,

              createdAt:
                typeof data.createdAt ===
                  "number"
                  ? data.createdAt
                  : Date.now(),
            } as AuditLog;
          }
        );

      onData(logs);
    },
    onError
  );
}
