import {
  useEffect,
  useMemo,
  useRef,
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
  type CashMutationContext,
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
    dayEndsLoading,
    setDayEndsLoading,
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

  const [
    currentDateKey,
    setCurrentDateKey,
  ] = useState(() =>
    createDateKey(new Date())
  );

  const savingRef = useRef(false);
  const editingRef = useRef(false);
  const deletingRef = useRef(false);
  const settingsSavingRef =
    useRef(false);
  const archivingRef = useRef(false);

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

  useEffect(() => {
    function refreshDateKey() {
      setCurrentDateKey(
        createDateKey(new Date())
      );
    }

    const timer = window.setInterval(
      refreshDateKey,
      30_000
    );

    document.addEventListener(
      "visibilitychange",
      refreshDateKey
    );

    return () => {
      window.clearInterval(timer);
      document.removeEventListener(
        "visibilitychange",
        refreshDateKey
      );
    };
  }, []);

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
              setDayEndsLoading(false);
            },
            (error) => {
              if (!mounted) return;

              setSyncError(
                `Gün sonları yüklenemedi: ${error.message}`
              );
              setDayEndsLoading(false);
            }
          );
      } catch (error) {
        if (!mounted) return;

        setDayEndsLoading(false);
        setSyncError(
          error instanceof Error
            ? error.message
            : "Gün sonları yüklenemedi."
        );
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
      return transactions.filter(
        (transaction) =>
          createDateKey(
            new Date(
              transaction.createdAt
            )
          ) === currentDateKey
      );
    }, [
      transactions,
      currentDateKey,
    ]);

  const todayDateKey = currentDateKey;

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

  function cashDataIsReady(): boolean {
    if (
      loading ||
      settingsLoading ||
      dayEndsLoading
    ) {
      setSyncError(
        "Kasa verileri henüz tamamen yüklenmedi. Lütfen kısa bir süre sonra tekrar dene."
      );

      return false;
    }

    return true;
  }

  function getCashMutationContext():
    CashMutationContext {
    return {
      transactions,
      dayEnds,
      openingBalance:
        settings.openingBalance,
    };
  }

  function openTransactionModal(
    type: TransactionType
  ) {
    setTransactionType(type);
    setTransactionModalOpen(true);
    setSyncError("");
  }

  async function persistTransaction(
    transaction: PendingTransaction
  ): Promise<boolean> {
    if (
      savingRef.current ||
      !cashDataIsReady()
    ) {
      return false;
    }

    savingRef.current = true;
    setSaving(true);
    setSyncError("");

    try {
      await createTransaction(
        {
          ...transaction,
          createdAt: Date.now(),
        },
        getCashMutationContext()
      );

      return true;
    } catch (error) {
      setSyncError(
        error instanceof Error
          ? `İşlem kaydedilemedi: ${error.message}`
          : "İşlem kaydedilemedi."
      );

      return false;
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  async function saveTransaction(
    amount: number,
    description: string
  ): Promise<void> {
    if (savingRef.current) {
      return;
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

      return;
    }

    const saved =
      await persistTransaction(
      pending
    );

    if (saved) {
      setTransactionModalOpen(false);
    }
  }

  async function confirmLargeTransaction():
    Promise<void> {
    if (
      !pendingLargeTransaction ||
      savingRef.current
    ) {
      return;
    }

    const saved =
      await persistTransaction(
        pendingLargeTransaction
      );

    if (saved) {
      setPendingLargeTransaction(null);
    }
  }

  async function handleCashAdjustment(
    difference: number
  ): Promise<void> {
    if (
      !Number.isFinite(difference) ||
      Math.abs(difference) < 0.005
    ) {
      return;
    }

    const saved =
      await persistTransaction({
        type:
          difference > 0
            ? "income"
            : "expense",

        amount:
          Math.abs(difference),

        description:
          "Kasa Düzeltmesi",
      });

    if (saved) {
      setAdjustmentModalOpen(false);
    }
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

  async function saveEditedTransaction(
    id: string,
    type: TransactionType,
    amount: number,
    description: string
  ): Promise<void> {
    const before =
      selectedTransaction;

    if (
      !before ||
      editingRef.current ||
      !cashDataIsReady()
    ) {
      return;
    }

    editingRef.current = true;
    setEditing(true);

    try {
      await updateTransaction(
        id,
        {
          type,
          amount,
          description,
        },
        before,
        getCashMutationContext()
      );

      setEditModalOpen(false);
      setSelectedTransaction(null);
    } catch (error) {
      setSyncError(
        error instanceof Error
          ? `İşlem düzenlenemedi: ${error.message}`
          : "İşlem düzenlenemedi."
      );
    } finally {
      editingRef.current = false;
      setEditing(false);
    }
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

  async function confirmDeleteTransaction():
    Promise<void> {
    if (
      !deleteCandidate ||
      deletingRef.current ||
      !cashDataIsReady()
    ) {
      return;
    }

    const transaction =
      deleteCandidate;

    deletingRef.current = true;
    setDeleting(true);

    try {
      await deleteTransaction(
        transaction.id,
        transaction,
        getCashMutationContext()
      );

      setDeleteCandidate(null);
      setDeletedTransaction(transaction);
    } catch (error) {
      setSyncError(
        error instanceof Error
          ? `İşlem silinemedi: ${error.message}`
          : "İşlem silinemedi."
      );
    } finally {
      deletingRef.current = false;
      setDeleting(false);
    }
  }

  async function handleUndoDelete(
    transaction: Transaction
  ): Promise<void> {
    if (
      deletingRef.current ||
      !cashDataIsReady()
    ) {
      return;
    }

    deletingRef.current = true;
    setDeleting(true);

    try {
      await restoreTransaction(
        transaction,
        getCashMutationContext()
      );

      setDeletedTransaction(null);
    } catch (error) {
      setSyncError(
        error instanceof Error
          ? `İşlem geri getirilemedi: ${error.message}`
          : "İşlem geri getirilemedi."
      );
    } finally {
      deletingRef.current = false;
      setDeleting(false);
    }
  }

  async function handleSaveQuickDescriptions(
    descriptions:
      QuickDescription[]
  ): Promise<void> {
    if (settingsSavingRef.current) {
      throw new Error(
        "Başka bir ayar halen kaydediliyor."
      );
    }

    settingsSavingRef.current = true;
    setSettingsSaving(true);
    setSyncError("");

    try {
      await saveQuickDescriptions(
        descriptions
      );
    } catch (error) {
      setSyncError(
        error instanceof Error
          ? error.message
          : "Ayar kaydedilemedi."
      );

      throw error;
    } finally {
      settingsSavingRef.current = false;
      setSettingsSaving(false);
    }
  }

  async function handleSaveOpeningBalance(
    amount: number
  ): Promise<void> {
    if (settingsSavingRef.current) {
      throw new Error(
        "Başka bir ayar halen kaydediliyor."
      );
    }

    settingsSavingRef.current = true;
    setSettingsSaving(true);
    setSyncError("");

    try {
      await saveOpeningBalance(
        amount,
        transactions,
        dayEnds
      );
    } catch (error) {
      setSyncError(
        error instanceof Error
          ? error.message
          : "Başlangıç kasası kaydedilemedi."
      );

      throw error;
    } finally {
      settingsSavingRef.current = false;
      setSettingsSaving(false);
    }
  }

  async function handleSaveGeneralSettings(
    newSettings: AppSettings
  ): Promise<void> {
    if (settingsSavingRef.current) {
      throw new Error(
        "Başka bir ayar halen kaydediliyor."
      );
    }

    settingsSavingRef.current = true;
    setSettingsSaving(true);
    setSyncError("");

    try {
      await saveGeneralSettings(
        newSettings
      );

      setSettings(newSettings);
    } catch (error) {
      setSyncError(
        error instanceof Error
          ? error.message
          : "Ayarlar kaydedilemedi."
      );

      throw error;
    } finally {
      settingsSavingRef.current = false;
      setSettingsSaving(false);
    }
  }

  async function handleArchiveDayEnd():
    Promise<void> {
    if (
      archivingRef.current ||
      !cashDataIsReady()
    ) {
      return;
    }

    archivingRef.current = true;
    setArchivingDayEnd(true);
    setSyncError("");

    try {
      await saveDayEnd({
        transactions:
          todayTransactions,
        balance,
        dateKey: currentDateKey,
      });

      if (
        settings.printer.enabled &&
        settings.printer
          .autoPrintDayEnd
      ) {
        try {
          await queueDayEndPrint({
            transactions:
              todayTransactions,
            balance,
          });
        } catch (error) {
          setSyncError(
            error instanceof Error
              ? `Gün sonu kaydedildi ancak yazdırma kuyruğuna eklenemedi: ${error.message}`
              : "Gün sonu kaydedildi ancak yazdırma kuyruğuna eklenemedi."
          );
        }
      }

      dismissReminder();
    } catch (error) {
      setSyncError(
        error instanceof Error
          ? error.message
          : "Gün sonu kaydedilemedi."
      );
    } finally {
      archivingRef.current = false;
      setArchivingDayEnd(false);
    }
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
          saving={
            saving ||
            editing ||
            deleting
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
      activePage === "reports"
    ) {
      return (
        <ReportsPage
          transactions={
            transactions
          }
          dayEnds={dayEnds}
          currentDateKey={
            currentDateKey
          }
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
        {activePage !== "home" &&
          syncError && (
            <div
              className="app-global-error"
              role="alert"
            >
              <span>{syncError}</span>

              <button
                type="button"
                onClick={() =>
                  setSyncError("")
                }
                aria-label="Hata mesajını kapat"
              >
                ×
              </button>
            </div>
          )}

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
        saving={saving}
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
        saving={saving}
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
