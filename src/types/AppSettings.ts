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
};

export const defaultAppSettings: AppSettings = {
  quickDescriptions: [],
};