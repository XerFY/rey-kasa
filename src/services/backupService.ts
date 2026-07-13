import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  writeBatch,
} from "firebase/firestore";

import { db } from "../firebase";

import {
  defaultAppSettings,
  type AppSettings,
} from "../types/AppSettings";

import type { DayEndRecord } from "../types/DayEndRecord";
import type { Transaction } from "../types/Transaction";

export type ReyKasaBackup = {
  application: "REY_KASA";
  version: 1;
  exportedAt: number;

  transactions: Transaction[];
  dayEnds: DayEndRecord[];
  settings: AppSettings;
};

type BatchWriter =
  ReturnType<typeof writeBatch>;

type BatchOperation = (
  batch: BatchWriter
) => void;

function isObject(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null
  );
}

function isTransaction(
  value: unknown
): value is Transaction {
  if (!isObject(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    (
      value.type === "income" ||
      value.type === "expense"
    ) &&
    typeof value.amount === "number" &&
    Number.isFinite(value.amount) &&
    value.amount > 0 &&
    typeof value.description === "string" &&
    typeof value.createdAt === "number"
  );
}

function isDayEndRecord(
  value: unknown
): value is DayEndRecord {
  if (!isObject(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.dateKey === "string" &&
    typeof value.closedAt === "number" &&
    typeof value.totalIncome === "number" &&
    typeof value.totalExpense === "number" &&
    typeof value.netTotal === "number" &&
    typeof value.balance === "number" &&
    typeof value.transactionCount === "number" &&
    Array.isArray(value.transactions) &&
    value.transactions.every(
      isTransaction
    )
  );
}

function validateBackup(
  value: unknown
): ReyKasaBackup {
  if (
    !isObject(value) ||
    value.application !== "REY_KASA" ||
    value.version !== 1 ||
    typeof value.exportedAt !== "number" ||
    !Array.isArray(value.transactions) ||
    !value.transactions.every(
      isTransaction
    ) ||
    !Array.isArray(value.dayEnds) ||
    !value.dayEnds.every(
      isDayEndRecord
    ) ||
    !isObject(value.settings)
  ) {
    throw new Error(
      "Seçilen dosya geçerli bir REY KASA yedeği değil."
    );
  }

  return value as ReyKasaBackup;
}

async function createBackup():
  Promise<ReyKasaBackup> {
  const [
    transactionsSnapshot,
    dayEndsSnapshot,
    settingsSnapshot,
  ] = await Promise.all([
    getDocs(
      collection(
        db,
        "transactions"
      )
    ),

    getDocs(
      collection(
        db,
        "dayEnds"
      )
    ),

    getDoc(
      doc(
        db,
        "settings",
        "general"
      )
    ),
  ]);

  const transactions =
    transactionsSnapshot.docs.map(
      (document) => ({
        id: document.id,
        ...document.data(),
      })
    ) as Transaction[];

  const dayEnds =
    dayEndsSnapshot.docs.map(
      (document) => ({
        id: document.id,
        ...document.data(),
      })
    ) as DayEndRecord[];

  const settings =
    settingsSnapshot.exists()
      ? (
          settingsSnapshot.data()
          as AppSettings
        )
      : defaultAppSettings;

  return {
    application: "REY_KASA",
    version: 1,
    exportedAt: Date.now(),
    transactions,
    dayEnds,
    settings,
  };
}

function createFileName(): string {
  const now = new Date();

  const date = now
    .toLocaleDateString(
      "tr-TR"
    )
    .replace(/\./g, "-");

  const time = now
    .toLocaleTimeString(
      "tr-TR",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    )
    .replace(":", "-");

  return `rey-kasa-yedek-${date}-${time}.json`;
}

export async function downloadBackup():
  Promise<string> {
  const backup =
    await createBackup();

  const fileName =
    createFileName();

  const json = JSON.stringify(
    backup,
    null,
    2
  );

  const file = new File(
    [json],
    fileName,
    {
      type: "application/json",
    }
  );

  const shareNavigator =
    navigator as Navigator & {
      canShare?: (
        data: {
          files: File[];
        }
      ) => boolean;

      share?: (
        data: {
          files: File[];
          title: string;
        }
      ) => Promise<void>;
    };

  if (
    shareNavigator.share &&
    shareNavigator.canShare?.({
      files: [file],
    })
  ) {
    await shareNavigator.share({
      files: [file],
      title: "REY KASA Yedeği",
    });

    return fileName;
  }

  const url =
    URL.createObjectURL(file);

  const link =
    document.createElement("a");

  link.href = url;
  link.download = fileName;

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);

  return fileName;
}

export async function readBackupFile(
  file: File
): Promise<ReyKasaBackup> {
  if (
    !file.name
      .toLocaleLowerCase("tr-TR")
      .endsWith(".json")
  ) {
    throw new Error(
      "Lütfen REY KASA JSON yedek dosyasını seç."
    );
  }

  const text =
    await file.text();

  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(
      "Yedek dosyası okunamadı."
    );
  }

  return validateBackup(parsed);
}

async function commitOperations(
  operations: BatchOperation[]
): Promise<void> {
  const operationLimit = 400;

  for (
    let index = 0;
    index < operations.length;
    index += operationLimit
  ) {
    const batch =
      writeBatch(db);

    const currentOperations =
      operations.slice(
        index,
        index + operationLimit
      );

    currentOperations.forEach(
      (operation) =>
        operation(batch)
    );

    await batch.commit();
  }
}

export async function restoreBackup(
  backup: ReyKasaBackup
): Promise<void> {
  const operations:
    BatchOperation[] = [];

  backup.transactions.forEach(
    (transaction) => {
      operations.push(
        (batch) => {
          batch.set(
            doc(
              db,
              "transactions",
              transaction.id
            ),
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
        }
      );
    }
  );

  backup.dayEnds.forEach(
    (record) => {
      operations.push(
        (batch) => {
          batch.set(
            doc(
              db,
              "dayEnds",
              record.id ||
                record.dateKey
            ),
            {
              dateKey:
                record.dateKey,

              closedAt:
                record.closedAt,

              totalIncome:
                record.totalIncome,

              totalExpense:
                record.totalExpense,

              netTotal:
                record.netTotal,

              balance:
                record.balance,

              transactionCount:
                record.transactionCount,

              transactions:
                record.transactions,
            }
          );
        }
      );
    }
  );

  await commitOperations(
    operations
  );

  await setDoc(
    doc(
      db,
      "settings",
      "general"
    ),
    backup.settings
  );
}