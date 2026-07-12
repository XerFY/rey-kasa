import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  type Unsubscribe,
} from "firebase/firestore";

import { db } from "../firebase";

import type { DayEndRecord } from "../types/DayEndRecord";
import type { Transaction } from "../types/Transaction";

const dayEndsCollection = collection(
  db,
  "dayEnds"
);

function createDateKey(
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

type CreateDayEndParams = {
  transactions: Transaction[];
  balance: number;
};

export async function saveDayEnd({
  transactions,
  balance,
}: CreateDayEndParams): Promise<void> {
  const now = new Date();
  const dateKey = createDateKey(now);

  const totalIncome = transactions
    .filter(
      (transaction) =>
        transaction.type === "income"
    )
    .reduce(
      (total, transaction) =>
        total + transaction.amount,
      0
    );

  const totalExpense = transactions
    .filter(
      (transaction) =>
        transaction.type === "expense"
    )
    .reduce(
      (total, transaction) =>
        total + transaction.amount,
      0
    );

  const dayEndDocument = doc(
    db,
    "dayEnds",
    dateKey
  );

  const record: Omit<
    DayEndRecord,
    "id"
  > = {
    dateKey,
    closedAt: Date.now(),

    totalIncome,
    totalExpense,
    netTotal:
      totalIncome - totalExpense,
    balance,

    transactionCount:
      transactions.length,

    transactions,
  };

  await setDoc(
    dayEndDocument,
    record
  );
}
export async function updateClosedDayAfterChange(
  record: DayEndRecord,
  before: Transaction | null,
  after: Transaction | null
): Promise<void> {
  let updatedTransactions =
    record.transactions.filter(
      (transaction) =>
        transaction.id !== before?.id &&
        transaction.id !== after?.id
    );

  if (after) {
    updatedTransactions = [
      ...updatedTransactions,
      after,
    ].sort(
      (first, second) =>
        second.createdAt -
        first.createdAt
    );
  }

  const beforeAmount =
    before === null
      ? 0
      : before.type === "income"
        ? before.amount
        : -before.amount;

  const afterAmount =
    after === null
      ? 0
      : after.type === "income"
        ? after.amount
        : -after.amount;

  const totalIncome =
    updatedTransactions
      .filter(
        (transaction) =>
          transaction.type === "income"
      )
      .reduce(
        (total, transaction) =>
          total + transaction.amount,
        0
      );

  const totalExpense =
    updatedTransactions
      .filter(
        (transaction) =>
          transaction.type === "expense"
      )
      .reduce(
        (total, transaction) =>
          total + transaction.amount,
        0
      );

  await setDoc(
    doc(
      db,
      "dayEnds",
      record.id
    ),
    {
      dateKey: record.dateKey,
      closedAt: record.closedAt,

      totalIncome,
      totalExpense,

      netTotal:
        totalIncome -
        totalExpense,

      balance:
        record.balance +
        afterAmount -
        beforeAmount,

      transactionCount:
        updatedTransactions.length,

      transactions:
        updatedTransactions,

      updatedAt: Date.now(),
    }
  );
}
export function listenDayEnds(
  onData: (
    records: DayEndRecord[]
  ) => void,
  onError: (error: Error) => void
): Unsubscribe {
  const dayEndsQuery = query(
    dayEndsCollection,
    orderBy("closedAt", "desc")
  );

  return onSnapshot(
    dayEndsQuery,
    (snapshot) => {
      const records =
        snapshot.docs.map(
          (document) => {
            const data =
              document.data();

            return {
              id: document.id,
              dateKey: data.dateKey,
              closedAt:
                data.closedAt,
              totalIncome:
                data.totalIncome,
              totalExpense:
                data.totalExpense,
              netTotal:
                data.netTotal,
              balance:
                data.balance,
              transactionCount:
                data.transactionCount,
              transactions:
                Array.isArray(
                  data.transactions
                )
                  ? data.transactions
                  : [],
            } as DayEndRecord;
          }
        );

      onData(records);
    },
    onError
  );
}