import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  type Unsubscribe,
} from "firebase/firestore";

import { db } from "../firebase";

import type { PrintJob } from "../types/PrintJob";
import type { Transaction } from "../types/Transaction";

const printJobsCollection =
  collection(
    db,
    "printJobs"
  );

type QueueDayEndParams = {
  transactions: Transaction[];
  balance: number;
};

export async function queueDayEndPrint({
  transactions,
  balance,
}: QueueDayEndParams): Promise<string> {
  const result =
    await addDoc(
      printJobsCollection,
      {
        type: "dayEnd",
        status: "pending",

        transactions,
        balance,

        createdAt: Date.now(),
        printedAt: null,

        attemptCount: 0,
        lastError: "",
      }
    );

  return result.id;
}

export async function queueTestPrint(): Promise<string> {
  const result =
    await addDoc(
      printJobsCollection,
      {
        type: "test",
        status: "pending",

        transactions: [],
        balance: 0,

        createdAt: Date.now(),
        printedAt: null,

        attemptCount: 0,
        lastError: "",
      }
    );

  return result.id;
}

export function listenPrintJobs(
  onData: (
    jobs: PrintJob[]
  ) => void,

  onError: (error: Error) => void
): Unsubscribe {
  const jobsQuery = query(
    printJobsCollection,
    orderBy("createdAt", "desc")
  );

  return onSnapshot(
    jobsQuery,
    (snapshot) => {
      const jobs =
        snapshot.docs.map(
          (document) => {
            const data =
              document.data();

            return {
              id: document.id,

              type:
                data.type === "test"
                  ? "test"
                  : "dayEnd",

              status:
                data.status ===
                  "printing" ||
                data.status ===
                  "printed" ||
                data.status ===
                  "failed"
                  ? data.status
                  : "pending",

              transactions:
                Array.isArray(
                  data.transactions
                )
                  ? data.transactions
                  : [],

              balance:
                typeof data.balance ===
                  "number"
                  ? data.balance
                  : 0,

              createdAt:
                typeof data.createdAt ===
                  "number"
                  ? data.createdAt
                  : Date.now(),

              printedAt:
                typeof data.printedAt ===
                  "number"
                  ? data.printedAt
                  : null,

              attemptCount:
                typeof data.attemptCount ===
                  "number"
                  ? data.attemptCount
                  : 0,

              lastError:
                typeof data.lastError ===
                  "string"
                  ? data.lastError
                  : "",
            } as PrintJob;
          }
        );

      onData(jobs);
    },
    onError
  );
}

export async function markPrintJobFailed(
  job: PrintJob,
  errorMessage: string
): Promise<void> {
  await updateDoc(
    doc(
      db,
      "printJobs",
      job.id
    ),
    {
      status: "failed",

      attemptCount:
        job.attemptCount + 1,

      lastError: errorMessage,
    }
  );
}

export async function retryPrintJob(
  id: string
): Promise<void> {
  await updateDoc(
    doc(
      db,
      "printJobs",
      id
    ),
    {
      status: "pending",
      lastError: "",
    }
  );
}

export async function markPrintJobCompleted(
  id: string
): Promise<void> {
  await updateDoc(
    doc(
      db,
      "printJobs",
      id
    ),
    {
      status: "printed",
      printedAt: Date.now(),
      lastError: "",
    }
  );
}