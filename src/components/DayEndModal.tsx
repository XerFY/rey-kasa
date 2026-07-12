import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Archive,
  Printer,
  RefreshCw,
  X,
} from "lucide-react";

import "../styles/DayEndModal.css";

import { printDayEndReport } from "../services/printService";

import type { Transaction } from "../types/Transaction";

type Props = {
  open: boolean;
  transactions: Transaction[];
  balance: number;

  alreadyArchived: boolean;
  archiving: boolean;

  onArchive: () => void | Promise<void>;
  onClose: () => void;
};

function formatMoney(
  amount: number
): string {
  return amount.toLocaleString(
    "tr-TR",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  );
}

function DayEndModal({
  open,
  transactions,
  balance,
  alreadyArchived,
  archiving,
  onArchive,
  onClose,
}: Props) {
  const [
    updateConfirmation,
    setUpdateConfirmation,
  ] = useState(false);

  const totalIncome = useMemo(() => {
    return transactions
      .filter(
        (transaction) =>
          transaction.type === "income"
      )
      .reduce(
        (total, transaction) =>
          total + transaction.amount,
        0
      );
  }, [transactions]);

  const totalExpense = useMemo(() => {
    return transactions
      .filter(
        (transaction) =>
          transaction.type === "expense"
      )
      .reduce(
        (total, transaction) =>
          total + transaction.amount,
        0
      );
  }, [transactions]);

  const netTotal =
    totalIncome - totalExpense;

  useEffect(() => {
    if (!open) {
      return;
    }

    setUpdateConfirmation(false);

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, [open]);

  if (!open) {
    return null;
  }

  function handlePrint() {
    printDayEndReport({
      transactions,
      balance,
    });
  }

  async function handleArchive() {
    if (
      alreadyArchived &&
      !updateConfirmation
    ) {
      setUpdateConfirmation(true);
      return;
    }

    await onArchive();
    setUpdateConfirmation(false);
  }

  return (
    <div
      className="day-end-overlay"
      onClick={onClose}
    >
      <section
        className="day-end-modal"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <header className="day-end-header">
          <div>
            <span>REY KASA</span>

            <h2>Gün Sonu Raporu</h2>

            <p>
              {new Date().toLocaleDateString(
                "tr-TR",
                {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                }
              )}
            </p>
          </div>

          <button
            type="button"
            className="day-end-close"
            onClick={onClose}
            disabled={archiving}
            aria-label="Kapat"
          >
            <X size={21} />
          </button>
        </header>

        {alreadyArchived && (
          <div className="archive-status">
            <Archive size={17} />

            Bu gün daha önce arşivlendi.
          </div>
        )}

        <div className="day-end-summary">
          <article className="summary-card income-summary">
            <span>Toplam Gelir</span>

            <strong>
              ₺{formatMoney(totalIncome)}
            </strong>
          </article>

          <article className="summary-card expense-summary">
            <span>Toplam Gider</span>

            <strong>
              ₺{formatMoney(totalExpense)}
            </strong>
          </article>

          <article className="summary-card">
            <span>Günün Neti</span>

            <strong
              className={
                netTotal >= 0
                  ? "positive"
                  : "negative"
              }
            >
              {netTotal >= 0
                ? "+"
                : "-"}
              ₺
              {formatMoney(
                Math.abs(netTotal)
              )}
            </strong>
          </article>

          <article className="summary-card balance-summary">
            <span>Toplam Kasa</span>

            <strong>
              ₺{formatMoney(balance)}
            </strong>
          </article>
        </div>

        <div className="day-end-transactions">
          <div className="day-end-section-title">
            <h3>Bugünkü İşlemler</h3>

            <span>
              {transactions.length} işlem
            </span>
          </div>

          {transactions.length === 0 ? (
            <div className="day-end-empty">
              Bugün herhangi bir işlem
              bulunmuyor.
            </div>
          ) : (
            <div className="day-end-list">
              {transactions.map(
                (transaction) => (
                  <article
                    className="day-end-transaction"
                    key={transaction.id}
                  >
                    <div>
                      <strong
                        className={
                          transaction.type ===
                          "income"
                            ? "day-end-income"
                            : "day-end-expense"
                        }
                      >
                        {transaction.type ===
                        "income"
                          ? "+"
                          : "-"}
                        ₺
                        {formatMoney(
                          transaction.amount
                        )}
                      </strong>

                      <p>
                        {
                          transaction.description
                        }
                      </p>
                    </div>

                    <time>
                      {new Date(
                        transaction.createdAt
                      ).toLocaleTimeString(
                        "tr-TR",
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </time>
                  </article>
                )
              )}
            </div>
          )}
        </div>

        {updateConfirmation && (
          <div className="archive-confirmation">
            <strong>
              Gün sonu güncellensin mi?
            </strong>

            <p>
              Önceki arşiv, güncel işlemler
              ve toplamlarla değiştirilecek.
            </p>

            <button
              type="button"
              onClick={() =>
                setUpdateConfirmation(false)
              }
              disabled={archiving}
            >
              Vazgeç
            </button>
          </div>
        )}

        <div className="day-end-actions">
          <button
            type="button"
            className="day-end-archive"
            onClick={() =>
              void handleArchive()
            }
            disabled={
              archiving ||
              transactions.length === 0
            }
          >
            {alreadyArchived ? (
              <RefreshCw size={20} />
            ) : (
              <Archive size={20} />
            )}

            {archiving
              ? "Kaydediliyor..."
              : alreadyArchived
                ? updateConfirmation
                  ? "Evet, Güncelle"
                  : "Gün Sonunu Güncelle"
                : "Günü Arşivle"}
          </button>

          <button
            type="button"
            className="day-end-print"
            onClick={handlePrint}
            disabled={archiving}
          >
            <Printer size={20} />
            Yazdır
          </button>

          <button
            type="button"
            className="day-end-finish"
            onClick={onClose}
            disabled={archiving}
          >
            Raporu Kapat
          </button>
        </div>
      </section>
    </div>
  );
}

export default DayEndModal;