import {
  useEffect,
  useMemo,
  useState,
} from "react";

import "./App.css";
import ClosedDayWarningModal from "./components/ClosedDayWarningModal";
import AddTransactionModal from "./components/AddTransactionModal";
import BottomNavigation, {
  type AppPage,
} from "./components/BottomNavigation";
import CashAdjustmentModal from "./components/CashAdjustmentModal";
import DayEndModal from "./components/DayEndModal";
import DayEndReminderBanner from "./components/DayEndReminderBanner";
import DeleteTransactionModal from "./components/DeleteTransactionModal";
import EditTransactionModal from "./components/EditTransactionModal";
import LargeTransactionModal from "./components/LargeTransactionModal";
import UndoDeleteToast from "./components/UndoDeleteToast";

import { useAppTheme } from "./hooks/useAppTheme";
import { useDayEndReminder } from "./hooks/useDayEndReminder";

import HomePage from "./pages/HomePage";
import ReportsPage from "./pages/ReportsPage";
import SettingsPage from "./pages/SettingsPage";
import TransactionsPage from "./pages/TransactionsPage";

import {
  listenDayEnds,
  saveDayEnd,
  updateClosedDayAfterChange,
} from "./services/dayEndService";

import {
  queueDayEndPrint,
} from "./services/printerQueueService";

import {
  listenSettings,
  saveGeneralSettings,
  saveOpeningBalance,
  saveQuickDescriptions,
} from "./services/settingsService";

import {
  connectFirebase,
  createTransaction,
  deleteTransaction,
  listenTransactions,
  restoreTransaction,
  updateTransaction,
} from "./services/transactionService";

import {
  defaultAppSettings,
  type AppSettings,
  type QuickDescription,
} from "./types/AppSettings";

import type { DayEndRecord } from "./types/DayEndRecord";
import type { Transaction } from "./types/Transaction";

import {
  createDateKey,
  findClosedDay,
} from "./utils/dateUtils";

type TransactionType =
  | "income"
  | "expense";

type PendingTransaction = {
  type: TransactionType;
  amount: number;
  description: string;
};
type ClosedDayWarning = {
  action: "edit" | "delete";
  transaction: Transaction;
};

function isSameDay(
  timestamp: number,
  targetDate: Date
): boolean {
  const date =
    new Date(timestamp);

  return (
    date.getDate() ===
      targetDate.getDate() &&
    date.getMonth() ===
      targetDate.getMonth() &&
    date.getFullYear() ===
      targetDate.getFullYear()
  );
}

function App() {
  const [
    transactions,
    setTransactions,
  ] = useState<Transaction[]>([]);
  const [
   closedDayWarning,
   setClosedDayWarning,
  ] = useState<ClosedDayWarning | null>(
  null
);
  const [
    dayEnds,
    setDayEnds,
  ] = useState<DayEndRecord[]>([]);

  const [
    settings,
    setSettings,
  ] = useState<AppSettings>(
    defaultAppSettings
  );

  const [
    activePage,
    setActivePage,
  ] = useState<AppPage>("home");

  const [
    transactionModalOpen,
    setTransactionModalOpen,
  ] = useState(false);

  const [
    adjustmentModalOpen,
    setAdjustmentModalOpen,
  ] = useState(false);

  const [
    dayEndModalOpen,
    setDayEndModalOpen,
  ] = useState(false);

  const [
    editModalOpen,
    setEditModalOpen,
  ] = useState(false);

  const [
    selectedTransaction,
    setSelectedTransaction,
  ] = useState<Transaction | null>(
    null
  );

  const [
    deleteCandidate,
    setDeleteCandidate,
  ] = useState<Transaction | null>(
    null
  );

  const [
    deletedTransaction,
    setDeletedTransaction,
  ] = useState<Transaction | null>(
    null
  );

  const [
    pendingLargeTransaction,
    setPendingLargeTransaction,
  ] = useState<PendingTransaction | null>(
    null
  );

  const [
    transactionType,
    setTransactionType,
  ] = useState<TransactionType>(
    "income"
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    editing,
    setEditing,
  ] = useState(false);

  const [
    deleting,
    setDeleting,
  ] = useState(false);

  const [
    settingsLoading,
    setSettingsLoading,
  ] = useState(true);

  const [
    settingsSaving,
    setSettingsSaving,
  ] = useState(false);

  const [
    archivingDayEnd,
    setArchivingDayEnd,
  ] = useState(false);

  const [
    hasPendingWrites,
    setHasPendingWrites,
  ] = useState(false);

  const [
    syncError,
    setSyncError,
  ] = useState("");

  useAppTheme(
  settings.theme,
  settingsLoading
);
useEffect(() => {
  try {
    localStorage.setItem(
      "rey-kasa-receipt-settings",
      JSON.stringify({
        businessName:
          settings.businessName,
        businessPhone:
          settings.businessPhone,
        receiptFooter:
          settings.receiptFooter,
      })
    );
  } catch {
    // Depolama kullanılamazsa
    // varsayılan fiş bilgileri kullanılır.
  }
}, [
  settings.businessName,
  settings.businessPhone,
  settings.receiptFooter,
]);
  const {
    showReminder,
    dismissReminder,
  } = useDayEndReminder(
    settings,
    transactions,
    dayEnds
  );

  useEffect(() => {
    let unsubscribe:
      | (() => void)
      | undefined;

    let mounted = true;

    async function start() {
      try {
        setLoading(true);

        await connectFirebase();

        if (!mounted) return;

        unsubscribe =
          listenTransactions(
            (
              records,
              pendingWrites
            ) => {
              if (!mounted) return;

              setTransactions(
                records
              );

              setHasPendingWrites(
                pendingWrites
              );

              setLoading(false);
              setSyncError("");
            },
            (error) => {
              if (!mounted) return;

              setLoading(false);

              setSyncError(
                `Bulut bağlantı hatası: ${error.message}`
              );
            }
          );
      } catch (error) {
        if (!mounted) return;

        setLoading(false);

        setSyncError(
          error instanceof Error
            ? error.message
            : "Firebase bağlantısı kurulamadı."
        );
      }
    }

    void start();

    return () => {
      mounted = false;
      unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    let unsubscribe:
      | (() => void)
      | undefined;

    let mounted = true;

    async function start() {
      try {
        await connectFirebase();

        if (!mounted) return;

        unsubscribe =
          listenSettings(
            (newSettings) => {
              if (!mounted) return;

              setSettings(
                newSettings
              );

              setSettingsLoading(
                false
              );
            },
            (error) => {
              if (!mounted) return;

              setSettingsLoading(
                false
              );

              setSyncError(
                `Ayarlar yüklenemedi: ${error.message}`
              );
            }
          );
      } catch (error) {
        if (!mounted) return;

        setSettingsLoading(false);

        setSyncError(
          error instanceof Error
            ? error.message
            : "Ayarlar yüklenemedi."
        );
      }
    }

    void start();

    return () => {
      mounted = false;
      unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    let unsubscribe:
      | (() => void)
      | undefined;

    let mounted = true;

    async function start() {
      try {
        await connectFirebase();

        if (!mounted) return;

        unsubscribe =
          listenDayEnds(
            (records) => {
              if (!mounted) return;

              setDayEnds(records);
            },
            (error) => {
              if (!mounted) return;

              setSyncError(
                `Gün sonları yüklenemedi: ${error.message}`
              );
            }
          );
      } catch (error) {
        console.error(error);
      }
    }

    void start();

    return () => {
      mounted = false;
      unsubscribe?.();
    };
  }, []);

  const balance =
    useMemo(() => {
      return transactions.reduce(
        (
          total,
          transaction
        ) => {
          return transaction.type ===
            "income"
            ? total +
                transaction.amount
            : total -
                transaction.amount;
        },
        settings.openingBalance
      );
    }, [
      transactions,
      settings.openingBalance,
    ]);

  const todayTransactions =
    useMemo(() => {
      const today =
        new Date();

      return transactions.filter(
        (transaction) =>
          isSameDay(
            transaction.createdAt,
            today
          )
      );
    }, [transactions]);

  const todayDateKey =
    createDateKey(
      new Date()
    );

  const todayAlreadyArchived =
    dayEnds.some(
      (record) =>
        record.dateKey ===
        todayDateKey
    );

  const lastUpdate =
    transactions.length > 0
      ? new Date(
          transactions[0].createdAt
        ).toLocaleString(
          "tr-TR",
          {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          }
        )
      : "Henüz işlem yok";

  function openTransactionModal(
    type: TransactionType
  ) {
    setTransactionType(type);
    setTransactionModalOpen(true);
    setSyncError("");
  }

  function persistTransaction(
    transaction: PendingTransaction
  ) {
    setSaving(true);
    setSyncError("");

    setTransactionModalOpen(
      false
    );

    void createTransaction({
      ...transaction,
      createdAt: Date.now(),
    }).catch((error) => {
      setSyncError(
        error instanceof Error
          ? `İşlem kaydedilemedi: ${error.message}`
          : "İşlem kaydedilemedi."
      );
    });

    setSaving(false);
  }

  function saveTransaction(
    amount: number,
    description: string
  ): Promise<void> {
    if (saving) {
      return Promise.resolve();
    }

    const pending: PendingTransaction = {
      type: transactionType,
      amount,
      description,
    };

    const requiresWarning =
      settings.largeTransactionWarningEnabled &&
      settings.largeTransactionThreshold > 0 &&
      amount >=
        settings.largeTransactionThreshold;

    if (requiresWarning) {
      setTransactionModalOpen(false);

      setPendingLargeTransaction(
        pending
      );

      return Promise.resolve();
    }

    persistTransaction(
      pending
    );

    return Promise.resolve();
  }

  function confirmLargeTransaction() {
    if (!pendingLargeTransaction) {
      return;
    }

    persistTransaction(
      pendingLargeTransaction
    );

    setPendingLargeTransaction(
      null
    );
  }

  function handleCashAdjustment(
    difference: number
  ): Promise<void> {
    if (
      !Number.isFinite(difference) ||
      Math.abs(difference) < 0.005
    ) {
      return Promise.resolve();
    }

    setAdjustmentModalOpen(false);

    persistTransaction({
      type:
        difference > 0
          ? "income"
          : "expense",

      amount:
        Math.abs(difference),

      description:
        "Kasa Düzeltmesi",
    });

    return Promise.resolve();
  }

  function continueEditTransaction(
  transaction: Transaction
) {
  setSelectedTransaction(transaction);
  setEditModalOpen(true);
  setSyncError("");
}

function openEditModal(
  transaction: Transaction
) {
  const closedDay =
    findClosedDay(
      transaction,
      dayEnds
    );

  if (closedDay) {
    setClosedDayWarning({
      action: "edit",
      transaction,
    });

    return;
  }

  continueEditTransaction(
    transaction
  );
}

  function saveEditedTransaction(
    id: string,
    type: TransactionType,
    amount: number,
    description: string
  ): Promise<void> {
    const before =
      selectedTransaction;

    if (!before) {
      return Promise.resolve();
    }

    const after: Transaction = {
      ...before,
      type,
      amount,
      description,
    };

    setEditing(true);
    setEditModalOpen(false);
    setSelectedTransaction(null);

    void updateTransaction(
      id,
      {
        type,
        amount,
        description,
      },
      before
    ).catch((error) => {
      setSyncError(
        error instanceof Error
          ? `İşlem düzenlenemedi: ${error.message}`
          : "İşlem düzenlenemedi."
      );
    });

    const closedDay =
      findClosedDay(
        before,
        dayEnds
      );

    if (closedDay) {
      void updateClosedDayAfterChange(
        closedDay,
        before,
        after
      );
    }

    setEditing(false);

    return Promise.resolve();
  }

  function continueDeleteTransaction(
  transaction: Transaction
) {
  setDeleteCandidate(transaction);
  setSyncError("");
}

function requestDeleteTransaction(
  transaction: Transaction
) {
  const closedDay =
    findClosedDay(
      transaction,
      dayEnds
    );

  if (closedDay) {
    setClosedDayWarning({
      action: "delete",
      transaction,
    });

    return;
  }

  continueDeleteTransaction(
    transaction
  );
}
function confirmClosedDayWarning() {
  if (!closedDayWarning) return;

  const warning =
    closedDayWarning;

  setClosedDayWarning(null);

  if (warning.action === "edit") {
    continueEditTransaction(
      warning.transaction
    );

    return;
  }

  continueDeleteTransaction(
    warning.transaction
  );
}

  function confirmDeleteTransaction():
    Promise<void> {
    if (
      !deleteCandidate ||
      deleting
    ) {
      return Promise.resolve();
    }

    const transaction =
      deleteCandidate;

    const closedDay =
      findClosedDay(
        transaction,
        dayEnds
      );

    setDeleting(true);
    setDeleteCandidate(null);

    setDeletedTransaction(
      transaction
    );

    void deleteTransaction(
      transaction.id,
      transaction
    ).catch((error) => {
      setDeletedTransaction(null);

      setSyncError(
        error instanceof Error
          ? `İşlem silinemedi: ${error.message}`
          : "İşlem silinemedi."
      );
    });

    if (closedDay) {
      void updateClosedDayAfterChange(
        closedDay,
        transaction,
        null
      );
    }

    setDeleting(false);

    return Promise.resolve();
  }

  function handleUndoDelete(
    transaction: Transaction
  ): Promise<void> {
    const closedDay =
      dayEnds.find(
        (record) =>
          record.dateKey ===
          createDateKey(
            new Date(
              transaction.createdAt
            )
          )
      );

    void restoreTransaction(
      transaction
    ).catch((error) => {
      setSyncError(
        error instanceof Error
          ? `İşlem geri getirilemedi: ${error.message}`
          : "İşlem geri getirilemedi."
      );
    });

    if (closedDay) {
      void updateClosedDayAfterChange(
        closedDay,
        null,
        transaction
      );
    }

    setDeletedTransaction(null);

    return Promise.resolve();
  }

  function handleSaveQuickDescriptions(
    descriptions:
      QuickDescription[]
  ): Promise<void> {
    setSettingsSaving(true);

    void saveQuickDescriptions(
      descriptions
    ).catch((error) => {
      setSyncError(
        error instanceof Error
          ? error.message
          : "Ayar kaydedilemedi."
      );
    });

    setSettingsSaving(false);

    return Promise.resolve();
  }

  function handleSaveOpeningBalance(
    amount: number
  ): Promise<void> {
    setSettingsSaving(true);

    void saveOpeningBalance(
      amount
    ).catch((error) => {
      setSyncError(
        error instanceof Error
          ? error.message
          : "Başlangıç kasası kaydedilemedi."
      );
    });

    setSettingsSaving(false);

    return Promise.resolve();
  }

  function handleSaveGeneralSettings(
    newSettings: AppSettings
  ): Promise<void> {
    setSettingsSaving(true);

    setSettings(
      newSettings
    );

    void saveGeneralSettings(
      newSettings
    ).catch((error) => {
      setSyncError(
        error instanceof Error
          ? error.message
          : "Ayarlar kaydedilemedi."
      );
    });

    setSettingsSaving(false);

    return Promise.resolve();
  }

  function handleArchiveDayEnd():
    Promise<void> {
    setArchivingDayEnd(true);

    void saveDayEnd({
      transactions:
        todayTransactions,

      balance,
    }).catch((error) => {
      setSyncError(
        error instanceof Error
          ? error.message
          : "Gün sonu kaydedilemedi."
      );
    });

    if (
      settings.printer.enabled &&
      settings.printer
        .autoPrintDayEnd
    ) {
      void queueDayEndPrint({
        transactions:
          todayTransactions,

        balance,
      }).catch((error) => {
        console.error(
          "Yazdırma kuyruğu hatası:",
          error
        );
      });
    }

    setArchivingDayEnd(false);
    dismissReminder();

    return Promise.resolve();
  }

  function renderPage() {
    if (activePage === "home") {
      return (
        <HomePage
          transactions={
            transactions
          }
          todayTransactions={
            todayTransactions
          }
          loading={loading}
          saving={
            saving ||
            editing ||
            deleting
          }
          syncError={syncError}
          hasPendingWrites={
            hasPendingWrites
          }
          balance={balance}
          todayTransactionCount={
            todayTransactions.length
          }
          lastUpdate={lastUpdate}
          onAddIncome={() =>
            openTransactionModal(
              "income"
            )
          }
          onAddExpense={() =>
            openTransactionModal(
              "expense"
            )
          }
          onAdjustBalance={() =>
            setAdjustmentModalOpen(
              true
            )
          }
          onShowAllTransactions={() =>
            setActivePage(
              "transactions"
            )
          }
          onDayEnd={() =>
            setDayEndModalOpen(
              true
            )
          }
          onEditTransaction={
            openEditModal
          }
          onDeleteTransaction={
            requestDeleteTransaction
          }
        />
      );
    }

    if (
      activePage ===
      "transactions"
    ) {
      return (
        <TransactionsPage
          transactions={
            transactions
          }
          loading={loading}
          onEditTransaction={
            openEditModal
          }
          onDeleteTransaction={
            requestDeleteTransaction
          }
        />
      );
    }

    if (
      activePage === "reports"
    ) {
      return (
        <ReportsPage
          transactions={
            transactions
          }
          dayEnds={dayEnds}
        />
      );
    }

    return (
      <SettingsPage
        settings={settings}
        loading={
          settingsLoading
        }
        saving={
          settingsSaving
        }
        onSaveQuickDescriptions={
          handleSaveQuickDescriptions
        }
        onSaveOpeningBalance={
          handleSaveOpeningBalance
        }
        onSaveGeneralSettings={
          handleSaveGeneralSettings
        }
      />
    );
  }

  return (
    <>
      <main className="app">
        {renderPage()}
      </main>

      <BottomNavigation
        activePage={activePage}
        onChange={setActivePage}
      />

      <AddTransactionModal
        open={
          transactionModalOpen
        }
        type={transactionType}
        quickDescriptions={
          settings.quickDescriptions
        }
        onClose={() =>
          setTransactionModalOpen(
            false
          )
        }
        onSave={saveTransaction}
      />

      <CashAdjustmentModal
        open={
          adjustmentModalOpen
        }
        currentBalance={balance}
        saving={saving}
        onClose={() =>
          setAdjustmentModalOpen(
            false
          )
        }
        onSave={
          handleCashAdjustment
        }
      />

      <EditTransactionModal
        open={editModalOpen}
        transaction={
          selectedTransaction
        }
        saving={editing}
        onClose={() => {
          setEditModalOpen(false);

          setSelectedTransaction(
            null
          );
        }}
        onSave={
          saveEditedTransaction
        }
      />

      <DeleteTransactionModal
        open={
          deleteCandidate !== null
        }
        transaction={
          deleteCandidate
        }
        deleting={deleting}
        onClose={() =>
          setDeleteCandidate(null)
        }
        onConfirm={
          confirmDeleteTransaction
        }
      />

      <DayEndModal
        open={dayEndModalOpen}
        transactions={
          todayTransactions
        }
        balance={balance}
        alreadyArchived={
          todayAlreadyArchived
        }
        archiving={
          archivingDayEnd
        }
        onArchive={
          handleArchiveDayEnd
        }
        onClose={() =>
          setDayEndModalOpen(
            false
          )
        }
      />

      <LargeTransactionModal
        open={
          pendingLargeTransaction !==
          null
        }
        type={
          pendingLargeTransaction
            ?.type ?? "income"
        }
        amount={
          pendingLargeTransaction
            ?.amount ?? 0
        }
        description={
          pendingLargeTransaction
            ?.description ?? ""
        }
        onConfirm={
          confirmLargeTransaction
        }
        onCancel={() =>
          setPendingLargeTransaction(
            null
          )
        }
      />
<ClosedDayWarningModal
  action={
    closedDayWarning?.action ??
    null
  }
  transaction={
    closedDayWarning?.transaction ??
    null
  }
  onClose={() =>
    setClosedDayWarning(null)
  }
  onConfirm={
    confirmClosedDayWarning
  }
/>
      <UndoDeleteToast
        transaction={
          deletedTransaction
        }
        onUndo={
          handleUndoDelete
        }
        onDismiss={() =>
          setDeletedTransaction(null)
        }
      />

      <DayEndReminderBanner
        visible={showReminder}
        onOpenDayEnd={() => {
          dismissReminder();

          setDayEndModalOpen(
            true
          );
        }}
        onDismiss={
          dismissReminder
        }
      />
    </>
  );
}

export default App;