import { useEffect, useMemo, useState } from "react";
import { Minus, Plus, Receipt } from "lucide-react";
import "./App.css";

import Header from "./components/Header";
import BalanceCard from "./components/BalanceCard";
import AddTransactionModal from "./components/AddTransactionModal";

import {
  connectFirebase,
  createTransaction,
  listenTransactions,
} from "./services/transactionService";

import type { Transaction } from "./types/Transaction";

type TransactionType = "income" | "expense";

function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
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
            console.error("Firestore dinleme hatası:", error);

            if (!mounted) {
              return;
            }

            setLoading(false);
            setSyncError(`Bulut bağlantı hatası: ${error.message}`);
          }
        );
      } catch (error) {
        console.error("Firebase başlatma hatası:", error);

        if (!mounted) {
          return;
        }

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
      if (transaction.type === "income") {
        return total + transaction.amount;
      }

      return total - transaction.amount;
    }, 0);
  }, [transactions]);

  const todayTransactionCount = useMemo(() => {
    const today = new Date();

    return transactions.filter((transaction) => {
      const transactionDate = new Date(transaction.createdAt);

      return (
        transactionDate.getDate() === today.getDate() &&
        transactionDate.getMonth() === today.getMonth() &&
        transactionDate.getFullYear() === today.getFullYear()
      );
    }).length;
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

  function openModal(type: TransactionType) {
    setTransactionType(type);
    setModalOpen(true);
    setSyncError("");
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setModalOpen(false);
  }

  async function saveTransaction(
    amount: number,
    description: string
  ): Promise<void> {
    try {
      setSaving(true);
      setSyncError("");

      const transaction = {
        type: transactionType,
        amount,
        description,
        createdAt: Date.now(),
      };

      console.log("Firebase'e gönderiliyor:", transaction);

      await createTransaction(transaction);

      console.log("Firebase'e kaydedildi.");

      setModalOpen(false);
    } catch (error) {
      console.error("İşlem kaydetme hatası:", error);

      const message =
        error instanceof Error ? error.message : "Bilinmeyen hata";

      setSyncError(`İşlem kaydedilemedi: ${message}`);
      window.alert(`İşlem kaydedilemedi:\n${message}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="app">
      <Header />

      <div className={`sync-status ${syncError ? "sync-error" : ""}`}>
        {syncError
          ? syncError
          : loading
            ? "Buluta bağlanıyor..."
            : "● Bulut senkronize"}
      </div>

      <BalanceCard
        balance={balance}
        transactionCount={todayTransactionCount}
        lastUpdate={lastUpdate}
      />

      <div className="buttons">
        <button
          type="button"
          className="income"
          onClick={() => openModal("income")}
          disabled={saving}
        >
          <Plus size={21} />
          Gelir Ekle
        </button>

        <button
          type="button"
          className="expense"
          onClick={() => openModal("expense")}
          disabled={saving}
        >
          <Minus size={21} />
          Gider Ekle
        </button>
      </div>

      <section className="transactions">
        <h3>Son İşlemler</h3>

        {loading ? (
          <div className="empty">İşlemler yükleniyor...</div>
        ) : transactions.length === 0 ? (
          <div className="empty">Henüz işlem bulunmuyor.</div>
        ) : (
          transactions.map((transaction) => (
            <article className="transaction-item" key={transaction.id}>
              <div>
                <strong
                  className={
                    transaction.type === "income"
                      ? "income-text"
                      : "expense-text"
                  }
                >
                  {transaction.type === "income" ? "+" : "-"} ₺
                  {transaction.amount.toLocaleString("tr-TR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </strong>

                <p>{transaction.description}</p>
              </div>

              <time dateTime={new Date(transaction.createdAt).toISOString()}>
                {new Date(transaction.createdAt).toLocaleString("tr-TR", {
                  day: "2-digit",
                  month: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </time>
            </article>
          ))
        )}
      </section>

      <button type="button" className="day-end">
        <Receipt size={21} />
        Gün Sonu
      </button>

      <AddTransactionModal
        open={modalOpen}
        type={transactionType}
        onClose={closeModal}
        onSave={saveTransaction}
      />
    </main>
  );
}

export default App;