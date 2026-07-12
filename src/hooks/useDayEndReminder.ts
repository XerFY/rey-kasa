import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import type { AppSettings } from "../types/AppSettings";
import type { DayEndRecord } from "../types/DayEndRecord";
import type { Transaction } from "../types/Transaction";

import {
  createDateKey,
} from "../utils/dateUtils";

type Result = {
  showReminder: boolean;
  dismissReminder: () => void;
};

export function useDayEndReminder(
  settings: AppSettings,
  transactions: Transaction[],
  dayEnds: DayEndRecord[]
): Result {
  const [now, setNow] =
    useState(() => new Date());

  const [dismissed, setDismissed] =
    useState(false);

  const todayKey =
    createDateKey(now);

  useEffect(() => {
    const timer =
      window.setInterval(() => {
        setNow(new Date());
      }, 30000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const dismissedKey =
      localStorage.getItem(
        "rey-kasa-reminder-dismissed"
      );

    setDismissed(
      dismissedKey === todayKey
    );
  }, [todayKey]);

  const showReminder =
    useMemo(() => {
      if (
        !settings.dayEndReminderEnabled ||
        dismissed
      ) {
        return false;
      }

      const hasTransactionsToday =
        transactions.some(
          (transaction) =>
            createDateKey(
              new Date(
                transaction.createdAt
              )
            ) === todayKey
        );

      if (!hasTransactionsToday) {
        return false;
      }

      const dayAlreadyClosed =
        dayEnds.some(
          (record) =>
            record.dateKey ===
            todayKey
        );

      if (dayAlreadyClosed) {
        return false;
      }

      const [
        reminderHour,
        reminderMinute,
      ] =
        settings.dayEndReminderTime
          .split(":")
          .map(Number);

      if (
        !Number.isFinite(
          reminderHour
        ) ||
        !Number.isFinite(
          reminderMinute
        )
      ) {
        return false;
      }

      const reminderTotal =
        reminderHour * 60 +
        reminderMinute;

      const currentTotal =
        now.getHours() * 60 +
        now.getMinutes();

      return (
        currentTotal >=
        reminderTotal
      );
    }, [
      settings.dayEndReminderEnabled,
      settings.dayEndReminderTime,
      transactions,
      dayEnds,
      todayKey,
      dismissed,
      now,
    ]);

  const dismissReminder =
    useCallback(() => {
      localStorage.setItem(
        "rey-kasa-reminder-dismissed",
        todayKey
      );

      setDismissed(true);
    }, [todayKey]);

  return {
    showReminder,
    dismissReminder,
  };
}