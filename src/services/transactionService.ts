import { signInAnonymously } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  type Unsubscribe,
} from "firebase/firestore";

import { auth, db } from "../firebase";
import type { Transaction } from "../types/Transaction";

const transactionsCollection = collection(db, "transactions");

async function ensureAuthenticated(): Promise<void> {
  if (!auth.currentUser) {
    await signInAnonymously(auth);
  }
}

export async function connectFirebase(): Promise<void> {
  await ensureAuthenticated();
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
      const transactions = snapshot.docs.map((document) => {
        const data = document.data();

        return {
          id: document.id,
          type: data.type,
          amount: data.amount,
          description: data.description,
          createdAt: data.createdAt,
        } as Transaction;
      });

      onData(transactions);
    },
    onError
  );
}

export async function createTransaction(
  transaction: Omit<Transaction, "id">
): Promise<void> {
  await ensureAuthenticated();
  await addDoc(transactionsCollection, transaction);
}

export async function updateTransaction(
  id: string,
  changes: Pick<Transaction, "type" | "amount" | "description">
): Promise<void> {
  await ensureAuthenticated();

  const transactionDocument = doc(db, "transactions", id);

  await updateDoc(transactionDocument, {
    type: changes.type,
    amount: changes.amount,
    description: changes.description,
  });
}

export async function deleteTransaction(id: string): Promise<void> {
  await ensureAuthenticated();

  const transactionDocument = doc(db, "transactions", id);
  await deleteDoc(transactionDocument);
}