import { signInAnonymously } from "firebase/auth";

import {
  collection,
  deleteDoc,
  doc,
  getDocFromCache,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  writeBatch,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from "firebase/firestore";

import { auth, db } from "../firebase";

import type {
  AuditAction,
  AuditLog,
} from "../types/AuditLog";

import type { Transaction } from "../types/Transaction";

const transactionsCollection = collection(
  db,
  "transactions"
);

const auditLogsCollection = collection(
  db,
  "auditLogs"
);

async function ensureAuthenticated(): Promise<void> {
  if (!auth.currentUser) {
    await signInAnonymously(auth);
  }
}

function mapTransaction(
  document: QueryDocumentSnapshot<DocumentData>
): Transaction {
  const data = document.data();

  return {
    id: document.id,

    type:
      data.type === "expense"
        ? "expense"
        : "income",

    amount:
      typeof data.amount === "number"
        ? data.amount
        : 0,

    description:
      typeof data.description === "string"
        ? data.description
        : "",

    createdAt:
      typeof data.createdAt === "number"
        ? data.createdAt
        : Date.now(),
  };
}

function createAuditDocument(
  action: AuditAction,
  transactionId: string,
  before: Transaction | null,
  after: Transaction | null
) {
  return {
    action,
    transactionId,
    before,
    after,
    createdAt: Date.now(),
  };
}

async function readCachedTransaction(
  id: string
): Promise<Transaction | null> {
  try {
    const snapshot =
      await getDocFromCache(
        doc(db, "transactions", id)
      );

    if (!snapshot.exists()) {
      return null;
    }

    const data = snapshot.data();

    return {
      id: snapshot.id,

      type:
        data.type === "expense"
          ? "expense"
          : "income",

      amount:
        typeof data.amount === "number"
          ? data.amount
          : 0,

      description:
        typeof data.description === "string"
          ? data.description
          : "",

      createdAt:
        typeof data.createdAt === "number"
          ? data.createdAt
          : Date.now(),
    };
  } catch {
    return null;
  }
}

export async function connectFirebase(): Promise<void> {
  await ensureAuthenticated();
}

export function listenTransactions(
  onData: (
    transactions: Transaction[],
    hasPendingWrites: boolean
  ) => void,

  onError: (error: Error) => void
): Unsubscribe {
  const transactionsQuery = query(
    transactionsCollection,
    orderBy("createdAt", "desc")
  );

  return onSnapshot(
    transactionsQuery,
    {
      includeMetadataChanges: true,
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
  transaction: Omit<Transaction, "id">
): Promise<void> {
  await ensureAuthenticated();

  const transactionDocument =
    doc(transactionsCollection);

  const newTransaction: Transaction = {
    id: transactionDocument.id,
    ...transaction,
  };

  const auditDocument =
    doc(auditLogsCollection);

  const batch = writeBatch(db);

  batch.set(
    transactionDocument,
    transaction
  );

  batch.set(
    auditDocument,
    createAuditDocument(
      "create",
      transactionDocument.id,
      null,
      newTransaction
    )
  );

  await batch.commit();
}

export async function updateTransaction(
  id: string,

  changes: Pick<
    Transaction,
    "type" | "amount" | "description"
  >,

  suppliedBefore?: Transaction
): Promise<void> {
  await ensureAuthenticated();

  const transactionDocument =
    doc(db, "transactions", id);

  const before =
    suppliedBefore ??
    (await readCachedTransaction(id));

  const after: Transaction | null =
    before
      ? {
          ...before,
          type: changes.type,
          amount: changes.amount,
          description:
            changes.description,
        }
      : null;

  const auditDocument =
    doc(auditLogsCollection);

  const batch = writeBatch(db);

  batch.update(
    transactionDocument,
    {
      type: changes.type,
      amount: changes.amount,
      description:
        changes.description,
    }
  );

  batch.set(
    auditDocument,
    createAuditDocument(
      "update",
      id,
      before,
      after
    )
  );

  await batch.commit();
}

export async function deleteTransaction(
  id: string,
  suppliedBefore?: Transaction
): Promise<Transaction | null> {
  await ensureAuthenticated();

  const transactionDocument =
    doc(db, "transactions", id);

  const before =
    suppliedBefore ??
    (await readCachedTransaction(id));

  const auditDocument =
    doc(auditLogsCollection);

  const batch = writeBatch(db);

  batch.delete(
    transactionDocument
  );

  batch.set(
    auditDocument,
    createAuditDocument(
      "delete",
      id,
      before,
      null
    )
  );

  await batch.commit();

  return before;
}

export async function restoreTransaction(
  transaction: Transaction
): Promise<void> {
  await ensureAuthenticated();

  const transactionDocument =
    doc(
      db,
      "transactions",
      transaction.id
    );

  const auditDocument =
    doc(auditLogsCollection);

  const batch = writeBatch(db);

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

  batch.set(
    auditDocument,
    createAuditDocument(
      "restore",
      transaction.id,
      null,
      transaction
    )
  );

  await batch.commit();
}

export function listenAuditLogs(
  onData: (
    logs: AuditLog[]
  ) => void,

  onError: (error: Error) => void,

  maximumRecordCount = 100
): Unsubscribe {
  const auditQuery = query(
    auditLogsCollection,
    orderBy("createdAt", "desc"),
    limit(maximumRecordCount)
  );

  return onSnapshot(
    auditQuery,
    (snapshot) => {
      const logs =
        snapshot.docs.map(
          (document) => {
            const data =
              document.data();

            return {
              id: document.id,

              action:
                data.action as AuditAction,

              transactionId:
                typeof data.transactionId ===
                "string"
                  ? data.transactionId
                  : "",

              before:
                data.before ?? null,

              after:
                data.after ?? null,

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

export async function permanentlyDeleteAuditLog(
  id: string
): Promise<void> {
  await ensureAuthenticated();

  await deleteDoc(
    doc(db, "auditLogs", id)
  );
}

export async function saveTransactionDirectly(
  transaction: Transaction
): Promise<void> {
  await ensureAuthenticated();

  await setDoc(
    doc(
      db,
      "transactions",
      transaction.id
    ),
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

export async function updateTransactionDirectly(
  transaction: Transaction
): Promise<void> {
  await ensureAuthenticated();

  await updateDoc(
    doc(
      db,
      "transactions",
      transaction.id
    ),
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