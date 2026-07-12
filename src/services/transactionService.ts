import { signInAnonymously } from "firebase/auth";
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  type Unsubscribe,
} from "firebase/firestore";

import { auth, db } from "../firebase";
import type { Transaction } from "../types/Transaction";

const transactionsCollection = collection(db, "transactions");

export async function connectFirebase(): Promise<void> {
  if (!auth.currentUser) {
    await signInAnonymously(auth);
  }
}

export function listenTransactions(
  onData: (transactions: Transaction[]) => void,
  onError: (error: Error) => void
): Unsubscribe {
  const transactionsQuery = query(
    transactionsCollection,
    orderBy("createdAt", "desc")
  );

  return onSnapshot(
    transactionsQuery,
    (snapshot) => {
      const transactions: Transaction[] = snapshot.docs.map((document) => {
        const data = document.data() as Omit<Transaction, "id">;

        return {
          id: document.id,
          ...data,
        };
      });

      onData(transactions);
    },
    (error) => {
      onError(error);
    }
  );
}

export async function createTransaction(
  transaction: Omit<Transaction, "id">
): Promise<void> {
  await addDoc(transactionsCollection, transaction);
}