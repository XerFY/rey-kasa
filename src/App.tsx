import { useEffect, useMemo, useState } from "react";

import "./App.css";

import AddTransactionModal from "./components/AddTransactionModal";
import BottomNavigation, {
  type AppPage,
} from "./components/BottomNavigation";
import DayEndModal from "./components/DayEndModal";

import HomePage from "./pages/HomePage";
import ReportsPage from "./pages/ReportsPage";
import SettingsPage from "./pages/SettingsPage";
import TransactionsPage from "./pages/TransactionsPage";

import {
  connectFirebase,
  createTransaction,
  listenTransactions,
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

  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [dayEndModalOpen, setDayEndModalOpen] = useState(false);

  const [transactionType, setTransactionType] =
    useState<TransactionType>("income");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncError, setSyncError] = useState("");

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let mounted = true;

    async function startFirebase() {
      try {
        setLoading(true);
        setSyncError("");

        await connectFirebase();

        if (!mounted) return;

        unsubscribe = listenTransactions(
          (firebaseTransactions) => {
            if (!mounted) return;

            setTransactions(firebaseTransactions);
            setLoading(false);
            setSyncError("");
          },
          (error) => {
            if (!mounted) return;

            console.error("Firestore dinleme hatası:", error);
            setLoading(false);
            setSyncError(`Bulut bağlantı hatası: ${error.message}`);
          }
        );
      } catch (error) {
        if (!mounted) return;

        console.error("Firebase başlatma hatası:", error);
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
    return transactions.reduce((total, transaction) => {
      return transaction.type === "income"
        ? total + transaction.amount
        : total - transaction.amount;
    }, 0);
  }, [transactions]);

  const todayTransactions = useMemo(() => {
    const today = new Date();

    return transactions.filter((transaction) =>
      isSameDay(transaction.createdAt, today)
    );
  }, [transactions]);

  const lastUpdate =
    transactions.length > 0
      ? new Date(transactions[0].createdAt).toLocaleString("tr-TR", {
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "Henüz işlem yok";

  function openTransactionModal(type: TransactionType) {
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
      console.error("İşlem kaydetme hatası:", error);

      setSyncError(
        error instanceof Error
          ? `İşlem kaydedilemedi: ${error.message}`
          : "İşlem kaydedilemedi."
      );
    } finally {
      setSaving(false);
    }
  }

  function renderPage() {
    if (activePage === "home") {
      return (
        <HomePage
          transactions={transactions}
          loading={loading}
          saving={saving}
          syncError={syncError}
          balance={balance}
          todayTransactionCount={todayTransactions.length}
          lastUpdate={lastUpdate}
          onAddIncome={() => openTransactionModal("income")}
          onAddExpense={() => openTransactionModal("expense")}
          onShowAllTransactions={() => setActivePage("transactions")}
          onDayEnd={() => setDayEndModalOpen(true)}
        />
      );
    }

    if (activePage === "transactions") {
      return (
        <TransactionsPage
          transactions={transactions}
          loading={loading}
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
      <main className="app">{renderPage()}</main>

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

      <DayEndModal
        open={dayEndModalOpen}
        transactions={todayTransactions}
        balance={balance}
        onClose={() => setDayEndModalOpen(false)}
      />
    </>
  );
}

export default App;