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
} from "../types/AppSettings";

const settingsDocument = doc(
  db,
  "settings",
  "general"
);

export function listenSettings(
  onData: (settings: AppSettings) => void,
  onError: (error: Error) => void
): Unsubscribe {
  return onSnapshot(
    settingsDocument,
    (snapshot) => {
      if (!snapshot.exists()) {
        onData(defaultAppSettings);
        return;
      }

      const data = snapshot.data();

      onData({
        quickDescriptions: Array.isArray(
          data.quickDescriptions
        )
          ? data.quickDescriptions.filter(
              (item): item is string =>
                typeof item === "string"
            )
          : [],
      });
    },
    onError
  );
}

export async function saveQuickDescriptions(
  descriptions: string[]
): Promise<void> {
  const cleanDescriptions = Array.from(
    new Set(
      descriptions
        .map((description) => description.trim())
        .filter(Boolean)
    )
  );

  await setDoc(
    settingsDocument,
    {
      quickDescriptions: cleanDescriptions,
    },
    {
      merge: true,
    }
  );
}