import {
  doc,
  onSnapshot,
  setDoc,
  type Unsubscribe,
} from "firebase/firestore";

import { db } from "../firebase";

import {
  defaultAppSettings,
  defaultPrinterSettings,
  type AppSettings,
  type PrinterSettings,
  type QuickDescription,
  type ThemeMode,
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
  (
    item.type === "income" ||
    item.type === "expense"
  ) &&
  (
    item.amount === undefined ||
    (
      typeof item.amount === "number" &&
      Number.isFinite(item.amount) &&
      item.amount > 0
    )
  )
);
}

function isThemeMode(
  value: unknown
): value is ThemeMode {
  return (
    value === "light" ||
    value === "dark" ||
    value === "system"
  );
}

function readString(
  value: unknown,
  fallback: string
): string {
  return typeof value === "string"
    ? value
    : fallback;
}

function readBoolean(
  value: unknown,
  fallback: boolean
): boolean {
  return typeof value === "boolean"
    ? value
    : fallback;
}

function readNumber(
  value: unknown,
  fallback: number
): number {
  return (
    typeof value === "number" &&
    Number.isFinite(value)
  )
    ? value
    : fallback;
}

function readPrinterSettings(
  value: unknown
): PrinterSettings {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return defaultPrinterSettings;
  }

  const printer = value as Record<
    string,
    unknown
  >;

  const rawPort = readNumber(
    printer.port,
    defaultPrinterSettings.port
  );

  const rawCharactersPerLine = readNumber(
    printer.charactersPerLine,
    defaultPrinterSettings.charactersPerLine
  );

  return {
    enabled: readBoolean(
      printer.enabled,
      defaultPrinterSettings.enabled
    ),

    ipAddress: readString(
      printer.ipAddress,
      defaultPrinterSettings.ipAddress
    ),

    port:
      rawPort >= 1 &&
      rawPort <= 65535
        ? Math.trunc(rawPort)
        : defaultPrinterSettings.port,

    autoPrintDayEnd: readBoolean(
      printer.autoPrintDayEnd,
      defaultPrinterSettings.autoPrintDayEnd
    ),

    charactersPerLine:
      rawCharactersPerLine >= 32 &&
      rawCharactersPerLine <= 64
        ? Math.trunc(
            rawCharactersPerLine
          )
        : defaultPrinterSettings.charactersPerLine,
  };
}

function normalizeSettings(
  data: Record<string, unknown>
): AppSettings {
  const rawDescriptions =
    data.quickDescriptions;

  const quickDescriptions =
    Array.isArray(rawDescriptions)
      ? rawDescriptions.filter(
          isQuickDescription
        )
      : [];

  const openingBalance = readNumber(
    data.openingBalance,
    defaultAppSettings.openingBalance
  );

  const largeTransactionThreshold =
    readNumber(
      data.largeTransactionThreshold,
      defaultAppSettings.largeTransactionThreshold
    );

  return {
    quickDescriptions,
    openingBalance,

    businessName: readString(
      data.businessName,
      defaultAppSettings.businessName
    ),

    businessPhone: readString(
      data.businessPhone,
      defaultAppSettings.businessPhone
    ),

    receiptFooter: readString(
      data.receiptFooter,
      defaultAppSettings.receiptFooter
    ),

    theme: isThemeMode(data.theme)
      ? data.theme
      : defaultAppSettings.theme,

    dayEndReminderEnabled: readBoolean(
      data.dayEndReminderEnabled,
      defaultAppSettings.dayEndReminderEnabled
    ),

    dayEndReminderTime: readString(
      data.dayEndReminderTime,
      defaultAppSettings.dayEndReminderTime
    ),

    largeTransactionWarningEnabled:
      readBoolean(
        data.largeTransactionWarningEnabled,
        defaultAppSettings.largeTransactionWarningEnabled
      ),

    largeTransactionThreshold:
      largeTransactionThreshold >= 0
        ? largeTransactionThreshold
        : defaultAppSettings.largeTransactionThreshold,

    printer: readPrinterSettings(
      data.printer
    ),
  };
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
        onData(defaultAppSettings);
        return;
      }

      onData(
        normalizeSettings(
          snapshot.data()
        )
      );
    },
    onError
  );
}

export async function saveQuickDescriptions(
  descriptions: QuickDescription[]
): Promise<void> {
  const cleanDescriptions =
    descriptions
      .map((description) => {
        const cleanAmount =
          typeof description.amount ===
            "number" &&
          Number.isFinite(
            description.amount
          ) &&
          description.amount > 0
            ? description.amount
            : null;

        return {
          id: description.id,
          type: description.type,
          label:
            description.label.trim(),

          ...(cleanAmount !== null
            ? {
                amount: cleanAmount,
              }
            : {}),
        };
      })
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

export async function saveGeneralSettings(
  settings: Pick<
    AppSettings,
    | "businessName"
    | "businessPhone"
    | "receiptFooter"
    | "theme"
    | "dayEndReminderEnabled"
    | "dayEndReminderTime"
    | "largeTransactionWarningEnabled"
    | "largeTransactionThreshold"
    | "printer"
  >
): Promise<void> {
  const businessName =
    settings.businessName.trim() ||
    defaultAppSettings.businessName;

  const businessPhone =
    settings.businessPhone.trim();

  const receiptFooter =
    settings.receiptFooter.trim();

  const largeTransactionThreshold =
    Number.isFinite(
      settings.largeTransactionThreshold
    ) &&
    settings.largeTransactionThreshold >= 0
      ? settings.largeTransactionThreshold
      : defaultAppSettings.largeTransactionThreshold;

  const printerPort =
    Number.isFinite(
      settings.printer.port
    ) &&
    settings.printer.port >= 1 &&
    settings.printer.port <= 65535
      ? Math.trunc(
          settings.printer.port
        )
      : defaultPrinterSettings.port;

  const charactersPerLine =
    Number.isFinite(
      settings.printer.charactersPerLine
    ) &&
    settings.printer.charactersPerLine >= 32 &&
    settings.printer.charactersPerLine <= 64
      ? Math.trunc(
          settings.printer.charactersPerLine
        )
      : defaultPrinterSettings.charactersPerLine;

  await setDoc(
    settingsDocument,
    {
      businessName,
      businessPhone,
      receiptFooter,

      theme: settings.theme,

      dayEndReminderEnabled:
        settings.dayEndReminderEnabled,

      dayEndReminderTime:
        settings.dayEndReminderTime,

      largeTransactionWarningEnabled:
        settings.largeTransactionWarningEnabled,

      largeTransactionThreshold,

      printer: {
        enabled:
          settings.printer.enabled,

        ipAddress:
          settings.printer.ipAddress.trim(),

        port: printerPort,

        autoPrintDayEnd:
          settings.printer.autoPrintDayEnd,

        charactersPerLine,
      },
    },
    {
      merge: true,
    }
  );
}