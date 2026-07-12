import {
  useEffect,
  useMemo,
  useState,
} from "react";

import "./App.css";

import AddTransactionModal from "./components/AddTransactionModal";
import BottomNavigation, {
  type AppPage,
} from "./components/BottomNavigation";
import CashAdjustmentModal from "./components/CashAdjustmentModal";
import DayEndModal from "./components/DayEndModal";
import DeleteTransactionModal from "./components/DeleteTransactionModal";
import EditTransactionModal from "./components/EditTransactionModal";

import HomePage from "./pages/HomePage";
import ReportsPage from "./pages/ReportsPage";
import SettingsPage from "./pages/SettingsPage";
import TransactionsPage from "./pages/TransactionsPage";

import {
  listenDayEnds,
  saveDayEnd,
} from "./services/dayEndService";

import {
  listenSettings,
  saveOpeningBalance,
  saveQuickDescriptions,
} from "./services/settingsService";

import {
  connectFirebase,
  createTransaction,
  deleteTransaction,
  listenTransactions,
  updateTransaction,
} from "./services/transactionService";

import type { QuickDescription } from "./types/AppSettings";
import type { DayEndRecord } from "./types/DayEndRecord";
import type { Transaction } from "./types/Transaction";

type TransactionType =
  | "income"
  | "expense";

function isSameDay(
  timestamp: number,
  targetDate: Date
): boolean {
  const date = new Date(timestamp);

  return (
    date.getDate() ===
      targetDate.getDate() &&
    date.getMonth() ===
      targetDate.getMonth() &&
    date.getFullYear() ===
      targetDate.getFullYear()
  );
}

function createDateKey(
  date: Date
): string {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function App() {
  const [
    transactions,
    setTransactions,
  ] = useState<Transaction[]>([]);

  const [dayEnds, setDayEnds] =
    useState<DayEndRecord[]>([]);

  const [activePage, setActivePage] =
    useState<AppPage>("home");

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
    transactionType,
    setTransactionType,
  ] = useState<TransactionType>(
    "income"
  );

  const [
    quickDescriptions,
    setQuickDescriptions,
  ] = useState<
    QuickDescription[]
  >([]);

  const [
    openingBalance,
    setOpeningBalance,
  ] = useState(0);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [editing, setEditing] =
    useState(false);

  const [deleting, setDeleting] =
    useState(false);

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
    syncError,
    setSyncError,
  ] = useState("");

  useEffect(() => {
    let unsubscribe:
      | (() => void)
      | undefined;

    let mounted = true;

    async function startFirebase() {
      try {
        setLoading(true);
        setSyncError("");

        await connectFirebase();

        if (!mounted) return;

        unsubscribe =
          listenTransactions(
            (
              firebaseTransactions
            ) => {
              if (!mounted) return;

              setTransactions(
                firebaseTransactions
              );

              setLoading(false);
              setSyncError("");
            },
            (error) => {
              if (!mounted) return;

              console.error(
                "Firestore dinleme hatası:",
                error
              );

              setLoading(false);

              setSyncError(
                `Bulut bağlantı hatası: ${error.message}`
              );
            }
          );
      } catch (error) {
        if (!mounted) return;

        console.error(
          "Firebase başlatma hatası:",
          error
        );

        setLoading(false);

        setSyncError(
          error instanceof Error
            ? `Firebase hatası: ${error.message}`
            : "Firebase bağlantısı kurulamadı."
        );
      }
    }

    void startFirebase();

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

    async function startSettings() {
      try {
        setSettingsLoading(true);

        await connectFirebase();

        if (!mounted) return;

        unsubscribe = listenSettings(
          (settings) => {
            if (!mounted) return;

            setQuickDescriptions(
              settings.quickDescriptions
            );

            setOpeningBalance(
              settings.openingBalance
            );

            setSettingsLoading(false);
          },
          (error) => {
            if (!mounted) return;

            console.error(
              "Ayarları okuma hatası:",
              error
            );

            setSettingsLoading(false);

            setSyncError(
              `Ayarlar yüklenemedi: ${error.message}`
            );
          }
        );
      } catch (error) {
        if (!mounted) return;

        console.error(
          "Ayar bağlantı hatası:",
          error
        );

        setSettingsLoading(false);

        setSyncError(
          error instanceof Error
            ? `Ayarlar yüklenemedi: ${error.message}`
            : "Ayarlar yüklenemedi."
        );
      }
    }

    void startSettings();

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

    async function startDayEnds() {
      try {
        await connectFirebase();

        if (!mounted) return;

        unsubscribe = listenDayEnds(
          (records) => {
            if (!mounted) return;

            setDayEnds(records);
          },
          (error) => {
            if (!mounted) return;

            console.error(
              "Gün sonu arşiv hatası:",
              error
            );

            setSyncError(
              `Gün sonları yüklenemedi: ${error.message}`
            );
          }
        );
      } catch (error) {
        console.error(
          "Gün sonu bağlantı hatası:",
          error
        );
      }
    }

    void startDayEnds();

    return () => {
      mounted = false;
      unsubscribe?.();
    };
  }, []);

  const balance = useMemo(() => {
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
      openingBalance
    );
  }, [
    transactions,
    openingBalance,
  ]);

  const todayTransactions =
    useMemo(() => {
      const today = new Date();

      return transactions.filter(
        (transaction) =>
          isSameDay(
            transaction.createdAt,
            today
          )
      );
    }, [transactions]);

  const todayDateKey =
    createDateKey(new Date());

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

  function closeTransactionModal() {
    if (!saving) {
      setTransactionModalOpen(
        false
      );
    }
  }

  async function saveTransaction(
    amount: number,
    description: string
  ): Promise<void> {
    try {
      setSaving(true);
      setSyncError("");

      await createTransaction({
        type: transactionType,
        amount,
        description,
        createdAt: Date.now(),
      });

      setTransactionModalOpen(
        false
      );
    } catch (error) {
      console.error(
        "İşlem kaydetme hatası:",
        error
      );

      setSyncError(
        error instanceof Error
          ? `İşlem kaydedilemedi: ${error.message}`
          : "İşlem kaydedilemedi."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleCashAdjustment(
    difference: number
  ): Promise<void> {
    if (
      !Number.isFinite(
        difference
      ) ||
      Math.abs(difference) <
        0.005
    ) {
      return;
    }

    try {
      setSaving(true);
      setSyncError("");

      await createTransaction({
        type:
          difference > 0
            ? "income"
            : "expense",

        amount:
          Math.abs(difference),

        description:
          "Kasa Düzeltmesi",

        createdAt: Date.now(),
      });

      setAdjustmentModalOpen(
        false
      );
    } catch (error) {
      console.error(
        "Kasa düzeltme hatası:",
        error
      );

      setSyncError(
        error instanceof Error
          ? `Kasa düzeltilemedi: ${error.message}`
          : "Kasa düzeltilemedi."
      );
    } finally {
      setSaving(false);
    }
  }

  function openEditModal(
    transaction: Transaction
  ) {
    setSelectedTransaction(
      transaction
    );

    setEditModalOpen(true);
    setSyncError("");
  }

  function closeEditModal() {
    if (editing) return;

    setEditModalOpen(false);

    setSelectedTransaction(
      null
    );
  }

  async function saveEditedTransaction(
    id: string,
    type: TransactionType,
    amount: number,
    description: string
  ): Promise<void> {
    try {
      setEditing(true);
      setSyncError("");

      await updateTransaction(
        id,
        {
          type,
          amount,
          description,
        }
      );

      setEditModalOpen(false);

      setSelectedTransaction(
        null
      );
    } catch (error) {
      console.error(
        "İşlem düzenleme hatası:",
        error
      );

      setSyncError(
        error instanceof Error
          ? `İşlem düzenlenemedi: ${error.message}`
          : "İşlem düzenlenemedi."
      );
    } finally {
      setEditing(false);
    }
  }

  function requestDeleteTransaction(
    transaction: Transaction
  ) {
    setDeleteCandidate(
      transaction
    );

    setSyncError("");
  }

  function closeDeleteModal() {
    if (!deleting) {
      setDeleteCandidate(null);
    }
  }

  async function confirmDeleteTransaction():
    Promise<void> {
    if (
      !deleteCandidate ||
      deleting
    ) {
      return;
    }

    try {
      setDeleting(true);
      setSyncError("");

      await deleteTransaction(
        deleteCandidate.id
      );

      setDeleteCandidate(null);
    } catch (error) {
      console.error(
        "İşlem silme hatası:",
        error
      );

      setSyncError(
        error instanceof Error
          ? `İşlem silinemedi: ${error.message}`
          : "İşlem silinemedi."
      );
    } finally {
      setDeleting(false);
    }
  }

  async function handleSaveQuickDescriptions(
    descriptions:
      QuickDescription[]
  ): Promise<void> {
    try {
      setSettingsSaving(true);
      setSyncError("");

      await saveQuickDescriptions(
        descriptions
      );
    } catch (error) {
      console.error(
        "Hazır açıklama kaydetme hatası:",
        error
      );

      setSyncError(
        error instanceof Error
          ? `Ayar kaydedilemedi: ${error.message}`
          : "Ayar kaydedilemedi."
      );
    } finally {
      setSettingsSaving(false);
    }
  }

  async function handleSaveOpeningBalance(
    amount: number
  ): Promise<void> {
    try {
      setSettingsSaving(true);
      setSyncError("");

      await saveOpeningBalance(
        amount
      );
    } catch (error) {
      console.error(
        "Başlangıç kasası kaydetme hatası:",
        error
      );

      setSyncError(
        error instanceof Error
          ? `Başlangıç kasası kaydedilemedi: ${error.message}`
          : "Başlangıç kasası kaydedilemedi."
      );
    } finally {
      setSettingsSaving(false);
    }
  }

  async function handleArchiveDayEnd():
    Promise<void> {
    try {
      setArchivingDayEnd(true);
      setSyncError("");

      await saveDayEnd({
        transactions:
          todayTransactions,
        balance,
      });
    } catch (error) {
      console.error(
        "Gün sonu kaydetme hatası:",
        error
      );

      setSyncError(
        error instanceof Error
          ? `Gün sonu kaydedilemedi: ${error.message}`
          : "Gün sonu kaydedilemedi."
      );
    } finally {
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
          loading={loading}
          saving={
            saving ||
            editing ||
            deleting
          }
          syncError={syncError}
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
        quickDescriptions={
          quickDescriptions
        }
        openingBalance={
          openingBalance
        }
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
          quickDescriptions
        }
        onClose={
          closeTransactionModal
        }
        onSave={saveTransaction}
      />

      <CashAdjustmentModal
        open={
          adjustmentModalOpen
        }
        currentBalance={
          balance
        }
        saving={saving}
        onClose={() => {
          if (!saving) {
            setAdjustmentModalOpen(
              false
            );
          }
        }}
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
        onClose={
          closeEditModal
        }
        onSave={
          saveEditedTransaction
        }
      />

      <DeleteTransactionModal
        open={
          deleteCandidate !==
          null
        }
        transaction={
          deleteCandidate
        }
        deleting={deleting}
        onClose={
          closeDeleteModal
        }
        onConfirm={
          confirmDeleteTransaction
        }
      />

      <DayEndModal
        open={
          dayEndModalOpen
        }
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
    </>
  );
}

export default App;