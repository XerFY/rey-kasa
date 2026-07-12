import {
  Minus,
  Plus,
  Receipt,
  Scale,
} from "lucide-react";

import BalanceCard from "../components/BalanceCard";
import Header from "../components/Header";
import TransactionList from "../components/TransactionList";
import ConnectionStatus from "../components/ConnectionStatus";
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
  onAdjustBalance: () => void;
  onShowAllTransactions: () => void;
  onDayEnd: () => void;

  onEditTransaction: (
    transaction: Transaction
  ) => void;

  onDeleteTransaction: (
    transaction: Transaction
  ) => void;
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
  onAdjustBalance,
  onShowAllTransactions,
  onDayEnd,
  onEditTransaction,
  onDeleteTransaction,
}: Props) {
  const recentTransactions =
    transactions.slice(0, 5);

  return (
    <>
      <Header />

      <ConnectionStatus
  loading={loading}
  syncError={syncError}
/>

      <BalanceCard
        balance={balance}
        transactionCount={
          todayTransactionCount
        }
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

      <button
        type="button"
        className="cash-adjust-button"
        onClick={onAdjustBalance}
        disabled={saving}
      >
        <Scale size={20} />
        Kasa Düzelt
      </button>

      <section className="transactions">
        <div className="section-heading">
          <h3>Son İşlemler</h3>

          {transactions.length > 5 && (
            <button
              type="button"
              className="text-button"
              onClick={
                onShowAllTransactions
              }
            >
              Tümünü Gör
            </button>
          )}
        </div>

        <TransactionList
          transactions={
            recentTransactions
          }
          loading={loading}
          onEdit={
            onEditTransaction
          }
          onDelete={
            onDeleteTransaction
          }
        />
      </section>

      <button
        type="button"
        className="day-end"
        onClick={onDayEnd}
      >
        <Receipt size={21} />
        Gün Sonu
      </button>
    </>
  );
}

export default HomePage;