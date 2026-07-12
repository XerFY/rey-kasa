export type QuickDescriptionType =
  | "income"
  | "expense";

export type QuickDescription = {
  id: string;
  type: QuickDescriptionType;
  label: string;
};

export type AppSettings = {
  quickDescriptions: QuickDescription[];
  openingBalance: number;
};

export const defaultAppSettings: AppSettings = {
  quickDescriptions: [],
  openingBalance: 0,
};