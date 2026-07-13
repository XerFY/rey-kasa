import {
  signInAnonymously,
} from "firebase/auth";

import {
  addDoc,
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
  type DocumentData,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from "firebase/firestore";

import {
  auth,
  db,
} from "../firebase";

import type {
  AuditAction,
  AuditLog,
} from "../types/AuditLog";

import type {
  Transaction,
} from "../types/Transaction";

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

async function ensureAuthenticated():
  Promise<void> {
  if (!auth.currentUser) {
    await signInAnonymously(
      auth
    );
  }
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

async function readCachedTransaction(
  id: string
): Promise<Transaction | null> {
  try {
    const snapshot =
      await getDocFromCache(
        doc(
          db,
          "transactions",
          id
        )
      );

    if (!snapshot.exists()) {
      return null;
    }

    const data =
      snapshot.data();

    return {
      id: snapshot.id,

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
  } catch {
    return null;
  }
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
    Omit<Transaction, "id">
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

  // Önce asıl kasa kaydı yapılır.
  await setDoc(
    transactionDocument,
    transaction
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

  suppliedBefore?: Transaction
): Promise<void> {
  await ensureAuthenticated();

  const transactionDocument =
    doc(
      db,
      "transactions",
      id
    );

  const before =
    suppliedBefore ??
    (
      await readCachedTransaction(
        id
      )
    );

  const after:
    Transaction | null =
      before
        ? {
            ...before,

            type:
              changes.type,

            amount:
              changes.amount,

            description:
              changes.description,
          }
        : null;

  // Önce asıl işlem güncellenir.
  await updateDoc(
    transactionDocument,
    {
      type:
        changes.type,

      amount:
        changes.amount,

      description:
        changes.description,
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
  suppliedBefore?: Transaction
): Promise<Transaction | null> {
  await ensureAuthenticated();

  const transactionDocument =
    doc(
      db,
      "transactions",
      id
    );

  const before =
    suppliedBefore ??
    (
      await readCachedTransaction(
        id
      )
    );

  // Önce asıl işlem silinir.
  await deleteDoc(
    transactionDocument
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
  transaction: Transaction
): Promise<void> {
  await ensureAuthenticated();

  const transactionDocument =
    doc(
      db,
      "transactions",
      transaction.id
    );

  // Önce asıl işlem geri getirilir.
  await setDoc(
    transactionDocument,
    {
      type:
        transaction.type,

      amount:
        transaction.amount,

      description:
        transaction.description,

      createdAt:
        transaction.createdAt,
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