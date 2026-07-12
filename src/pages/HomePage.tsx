import { Minus, Plus, Receipt } from "lucide-react";

import BalanceCard from "../components/BalanceCard";
import Header from "../components/Header";
import TransactionList from "../components/TransactionList";

import type { Transaction } from "../types/Transaction";

type Props = {
  transactions: Transaction[];
  loading: boolean;
  saving: boolean;
  syncError: string;
  balance: number;
  todayTransactionCount: number;
  lastUpdate: string;
  onAddIncome: () => void;
  onAddExpense: () => void;
  onShowAllTransactions: () => void;
  onDayEnd: () => void;
};

function HomePage({
  transactions,
  loading,
  saving,
  syncError,
  balance,
  todayTransactionCount,
  lastUpdate,
  onAddIncome,
  onAddExpense,
  onShowAllTransactions,
  onDayEnd,
}: Props) {
  const recentTransactions = transactions.slice(0, 5);

  return (
    <>
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
          onClick={onAddIncome}
          disabled={saving}
        >
          <Plus size={21} />
          Gelir Ekle
        </button>

        <button
          type="button"
          className="expense"
          onClick={onAddExpense}
          disabled={saving}
        >
          <Minus size={21} />
          Gider Ekle
        </button>
      </div>

      <section className="transactions">
        <div className="section-heading">
          <h3>Son İşlemler</h3>

          {transactions.length > 5 && (
            <button
              type="button"
              className="text-button"
              onClick={onShowAllTransactions}
            >
              Tümünü Gör
            </button>
          )}
        </div>

        <TransactionList
          transactions={recentTransactions}
          loading={loading}
        />
      </section>

      <button type="button" className="day-end" onClick={onDayEnd}>
        <Receipt size={21} />
        Gün Sonu
      </button>
    </>
  );
}

export default HomePage;