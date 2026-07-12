export type QuickDescriptionType =
  | "income"
  | "expense";

export type QuickDescription = {
  id: string;
  type: QuickDescriptionType;
  label: string;
};

export type ThemeMode =
  | "light"
  | "dark"
  | "system";

export type PrinterSettings = {
  enabled: boolean;
  ipAddress: string;
  port: number;
  autoPrintDayEnd: boolean;
  charactersPerLine: number;
};

export type AppSettings = {
  quickDescriptions: QuickDescription[];
  openingBalance: number;

  businessName: string;
  businessPhone: string;
  receiptFooter: string;

  theme: ThemeMode;

  dayEndReminderEnabled: boolean;
  dayEndReminderTime: string;

  largeTransactionWarningEnabled: boolean;
  largeTransactionThreshold: number;

  printer: PrinterSettings;
};

export const defaultPrinterSettings: PrinterSettings = {
  enabled: false,
  ipAddress: "",
  port: 9100,
  autoPrintDayEnd: false,
  charactersPerLine: 48,
};

export const defaultAppSettings: AppSettings = {
  quickDescriptions: [],
  openingBalance: 0,

  businessName: "REY KASA",
  businessPhone: "",
  receiptFooter: "İyi çalışmalar",

  theme: "light",

  dayEndReminderEnabled: false,
  dayEndReminderTime: "20:00",

  largeTransactionWarningEnabled: true,
  largeTransactionThreshold: 50000,

  printer: defaultPrinterSettings,
};