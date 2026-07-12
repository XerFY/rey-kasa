import {
  doc,
  onSnapshot,
  setDoc,
  type Unsubscribe,
} from "firebase/firestore";

import { db } from "../firebase";

import {
  defaultAppSettings,
  type AppSettings,
  type QuickDescription,
} from "../types/AppSettings";

const settingsDocument = doc(
  db,
  "settings",
  "general"
);

function isQuickDescription(
  value: unknown
): value is QuickDescription {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return false;
  }

  const item = value as Record<
    string,
    unknown
  >;

  return (
    typeof item.id === "string" &&
    typeof item.label === "string" &&
    (item.type === "income" ||
      item.type === "expense")
  );
}

export function listenSettings(
  onData: (
    settings: AppSettings
  ) => void,
  onError: (error: Error) => void
): Unsubscribe {
  return onSnapshot(
    settingsDocument,
    (snapshot) => {
      if (!snapshot.exists()) {
        onData(
          defaultAppSettings
        );

        return;
      }

      const data =
        snapshot.data();

      const rawDescriptions =
        data.quickDescriptions;

      const quickDescriptions =
        Array.isArray(
          rawDescriptions
        )
          ? rawDescriptions.filter(
              isQuickDescription
            )
          : [];

      const openingBalance =
        typeof data.openingBalance ===
          "number" &&
        Number.isFinite(
          data.openingBalance
        )
          ? data.openingBalance
          : 0;

      onData({
        quickDescriptions,
        openingBalance,
      });
    },
    onError
  );
}

export async function saveQuickDescriptions(
  descriptions: QuickDescription[]
): Promise<void> {
  const cleanDescriptions =
    descriptions
      .map((description) => ({
        id: description.id,
        type: description.type,
        label:
          description.label.trim(),
      }))
      .filter(
        (description) =>
          description.id &&
          description.label
      );

  await setDoc(
    settingsDocument,
    {
      quickDescriptions:
        cleanDescriptions,
    },
    {
      merge: true,
    }
  );
}

export async function saveOpeningBalance(
  openingBalance: number
): Promise<void> {
  if (
    !Number.isFinite(
      openingBalance
    )
  ) {
    throw new Error(
      "Geçersiz başlangıç kasa tutarı."
    );
  }

  await setDoc(
    settingsDocument,
    {
      openingBalance,
    },
    {
      merge: true,
    }
  );
}