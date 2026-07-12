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