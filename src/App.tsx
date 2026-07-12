import { useEffect, useMemo, useState } from "react";

import "./App.css";

import AddTransactionModal from "./components/AddTransactionModal";
import BottomNavigation, {
  type AppPage,
} from "./components/BottomNavigation";
import DayEndModal from "./components/DayEndModal";
import DeleteTransactionModal from "./components/DeleteTransactionModal";
import EditTransactionModal from "./components/EditTransactionModal";

import HomePage from "./pages/HomePage";
import ReportsPage from "./pages/ReportsPage";
import SettingsPage from "./pages/SettingsPage";
import TransactionsPage from "./pages/TransactionsPage";

import {
  connectFirebase,
  createTransaction,
  deleteTransaction,
  listenTransactions,
  updateTransaction,
} from "./services/transactionService";

import type { Transaction } from "./types/Transaction";

type TransactionType = "income" | "expense";

function isSameDay(timestamp: number, targetDate: Date): boolean {
  const date = new Date(timestamp);

  return (
    date.getDate() === targetDate.getDate() &&
    date.getMonth() === targetDate.getMonth() &&
    date.getFullYear() === targetDate.getFullYear()
  );
}

function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activePage, setActivePage] = useState<AppPage>("home");

  const [transactionModalOpen, setTransactionModalOpen] =
    useState(false);

  const [dayEndModalOpen, setDayEndModalOpen] =
    useState(false);

  const [editModalOpen, setEditModalOpen] =
    useState(false);

  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);

  const [deleteCandidate, setDeleteCandidate] =
    useState<Transaction | null>(null);

  const [transactionType, setTransactionType] =
    useState<TransactionType>("income");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [syncError, setSyncError] = useState("");

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let mounted = true;

    async function startFirebase() {
      try {
        setLoading(true);
        setSyncError("");

        await connectFirebase();

        if (!mounted) {
          return;
        }

        unsubscribe = listenTransactions(
          (firebaseTransactions) => {
            if (!mounted) {
              return;
            }

            setTransactions(firebaseTransactions);
            setLoading(false);
            setSyncError("");
          },
          (error) => {
            if (!mounted) {
              return;
            }

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
        if (!mounted) {
          return;
        }

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

  const balance = useMemo(() => {
    return transactions.reduce(
      (total, transaction) => {
        return transaction.type === "income"
          ? total + transaction.amount
          : total - transaction.amount;
      },
      0
    );
  }, [transactions]);

  const todayTransactions = useMemo(() => {
    const today = new Date();

    return transactions.filter((transaction) =>
      isSameDay(transaction.createdAt, today)
    );
  }, [transactions]);

  const lastUpdate =
    transactions.length > 0
      ? new Date(
          transactions[0].createdAt
        ).toLocaleString("tr-TR", {
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        })
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
      setTransactionModalOpen(false);
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

      setTransactionModalOpen(false);
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

  function openEditModal(
    transaction: Transaction
  ) {
    setSelectedTransaction(transaction);
    setEditModalOpen(true);
    setSyncError("");
  }

  function closeEditModal() {
    if (editing) {
      return;
    }

    setEditModalOpen(false);
    setSelectedTransaction(null);
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

      await updateTransaction(id, {
        type,
        amount,
        description,
      });

      setEditModalOpen(false);
      setSelectedTransaction(null);
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
    setDeleteCandidate(transaction);
    setSyncError("");
  }

  function closeDeleteModal() {
    if (!deleting) {
      setDeleteCandidate(null);
    }
  }

  async function confirmDeleteTransaction():
    Promise<void> {
    if (!deleteCandidate || deleting) {
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

  function renderPage() {
    if (activePage === "home") {
      return (
        <HomePage
          transactions={transactions}
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
            openTransactionModal("income")
          }
          onAddExpense={() =>
            openTransactionModal("expense")
          }
          onShowAllTransactions={() =>
            setActivePage("transactions")
          }
          onDayEnd={() =>
            setDayEndModalOpen(true)
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

    if (activePage === "transactions") {
      return (
        <TransactionsPage
          transactions={transactions}
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

    if (activePage === "reports") {
      return <ReportsPage />;
    }

    return <SettingsPage />;
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
        open={transactionModalOpen}
        type={transactionType}
        onClose={closeTransactionModal}
        onSave={saveTransaction}
      />

      <EditTransactionModal
        open={editModalOpen}
        transaction={selectedTransaction}
        saving={editing}
        onClose={closeEditModal}
        onSave={saveEditedTransaction}
      />

      <DeleteTransactionModal
        open={deleteCandidate !== null}
        transaction={deleteCandidate}
        deleting={deleting}
        onClose={closeDeleteModal}
        onConfirm={confirmDeleteTransaction}
      />

      <DayEndModal
        open={dayEndModalOpen}
        transactions={todayTransactions}
        balance={balance}
        onClose={() =>
          setDayEndModalOpen(false)
        }
      />
    </>
  );
}

export default App;