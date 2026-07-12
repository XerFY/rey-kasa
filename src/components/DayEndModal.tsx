import { useEffect, useMemo } from "react";
import { Printer, X } from "lucide-react";

import "../styles/DayEndModal.css";

import type { Transaction } from "../types/Transaction";

type Props = {
  open: boolean;
  transactions: Transaction[];
  balance: number;
  onClose: () => void;
};

function formatMoney(amount: number): string {
  return amount.toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function DayEndModal({
  open,
  transactions,
  balance,
  onClose,
}: Props) {
  const totalIncome = useMemo(() => {
    return transactions
      .filter((transaction) => transaction.type === "income")
      .reduce((total, transaction) => total + transaction.amount, 0);
  }, [transactions]);

  const totalExpense = useMemo(() => {
    return transactions
      .filter((transaction) => transaction.type === "expense")
      .reduce((total, transaction) => total + transaction.amount, 0);
  }, [transactions]);

  const netTotal = totalIncome - totalExpense;

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  function handlePrint() {
    window.print();
  }

  return (
    <div className="day-end-overlay" onClick={onClose}>
      <section
        className="day-end-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="day-end-header">
          <div>
            <span>REY KASA</span>

            <h2>Gün Sonu Raporu</h2>

            <p>
              {new Date().toLocaleDateString("tr-TR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>

          <button
            type="button"
            className="day-end-close"
            onClick={onClose}
            aria-label="Kapat"
          >
            <X size={21} />
          </button>
        </header>

        <div className="day-end-summary">
          <article className="summary-card income-summary">
            <span>Toplam Gelir</span>
            <strong>₺{formatMoney(totalIncome)}</strong>
          </article>

          <article className="summary-card expense-summary">
            <span>Toplam Gider</span>
            <strong>₺{formatMoney(totalExpense)}</strong>
          </article>

          <article className="summary-card">
            <span>Günün Neti</span>

            <strong className={netTotal >= 0 ? "positive" : "negative"}>
              {netTotal >= 0 ? "+" : "-"}₺
              {formatMoney(Math.abs(netTotal))}
            </strong>
          </article>

          <article className="summary-card balance-summary">
            <span>Toplam Kasa</span>
            <strong>₺{formatMoney(balance)}</strong>
          </article>
        </div>

        <div className="day-end-transactions">
          <div className="day-end-section-title">
            <h3>Bugünkü İşlemler</h3>
            <span>{transactions.length} işlem</span>
          </div>

          {transactions.length === 0 ? (
            <div className="day-end-empty">
              Bugün herhangi bir işlem bulunmuyor.
            </div>
          ) : (
            <div className="day-end-list">
              {transactions.map((transaction) => (
                <article
                  className="day-end-transaction"
                  key={transaction.id}
                >
                  <div>
                    <strong
                      className={
                        transaction.type === "income"
                          ? "day-end-income"
                          : "day-end-expense"
                      }
                    >
                      {transaction.type === "income" ? "+" : "-"}₺
                      {formatMoney(transaction.amount)}
                    </strong>

                    <p>{transaction.description}</p>
                  </div>

                  <time>
                    {new Date(transaction.createdAt).toLocaleTimeString(
                      "tr-TR",
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </time>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="day-end-actions">
          <button
            type="button"
            className="day-end-print"
            onClick={handlePrint}
          >
            <Printer size={20} />
            Yazdır
          </button>

          <button
            type="button"
            className="day-end-finish"
            onClick={onClose}
          >
            Raporu Kapat
          </button>
        </div>
      </section>
    </div>
  );
}

export default DayEndModal;