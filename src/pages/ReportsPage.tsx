import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  Wallet,
} from "lucide-react";
import { useMemo, useState } from "react";

import "../styles/ReportsPage.css";

import type { Transaction } from "../types/Transaction";

type ReportPeriod =
  | "daily"
  | "weekly"
  | "monthly";

type Props = {
  transactions: Transaction[];
};

function formatMoney(amount: number): string {
  return amount.toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getPeriodStart(
  period: ReportPeriod
): Date {
  const now = new Date();

  if (period === "daily") {
    return new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
  }

  if (period === "weekly") {
    const day =
      now.getDay() === 0
        ? 7
        : now.getDay();

    return new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - day + 1
    );
  }

  return new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  );
}

function ReportsPage({
  transactions,
}: Props) {
  const [period, setPeriod] =
    useState<ReportPeriod>("daily");

  const reportTransactions =
    useMemo(() => {
      const periodStart =
        getPeriodStart(period).getTime();

      return transactions.filter(
        (transaction) =>
          transaction.createdAt >=
          periodStart
      );
    }, [period, transactions]);

  const totalIncome = useMemo(() => {
    return reportTransactions
      .filter(
        (transaction) =>
          transaction.type === "income"
      )
      .reduce(
        (total, transaction) =>
          total + transaction.amount,
        0
      );
  }, [reportTransactions]);

  const totalExpense = useMemo(() => {
    return reportTransactions
      .filter(
        (transaction) =>
          transaction.type === "expense"
      )
      .reduce(
        (total, transaction) =>
          total + transaction.amount,
        0
      );
  }, [reportTransactions]);

  const netTotal =
    totalIncome - totalExpense;

  const periodTitle =
    period === "daily"
      ? "Bugün"
      : period === "weekly"
        ? "Bu Hafta"
        : "Bu Ay";

  return (
    <section className="reports-page">
      <header className="reports-header">
        <span>REY KASA</span>
        <h1>Raporlar</h1>

        <p>
          Gelir ve gider durumunu seçilen
          döneme göre incele.
        </p>
      </header>

      <div className="report-period-selector">
        <button
          type="button"
          className={
            period === "daily"
              ? "active"
              : ""
          }
          onClick={() =>
            setPeriod("daily")
          }
        >
          Günlük
        </button>

        <button
          type="button"
          className={
            period === "weekly"
              ? "active"
              : ""
          }
          onClick={() =>
            setPeriod("weekly")
          }
        >
          Haftalık
        </button>

        <button
          type="button"
          className={
            period === "monthly"
              ? "active"
              : ""
          }
          onClick={() =>
            setPeriod("monthly")
          }
        >
          Aylık
        </button>
      </div>

      <div className="report-period-heading">
        <div>
          <CalendarDays size={20} />

          <span>{periodTitle}</span>
        </div>

        <small>
          {reportTransactions.length} işlem
        </small>
      </div>

      <div className="report-summary-grid">
        <article className="report-card report-income">
          <div className="report-card-icon">
            <ArrowUpRight size={21} />
          </div>

          <span>Toplam Gelir</span>

          <strong>
            ₺{formatMoney(totalIncome)}
          </strong>
        </article>

        <article className="report-card report-expense">
          <div className="report-card-icon">
            <ArrowDownRight size={21} />
          </div>

          <span>Toplam Gider</span>

          <strong>
            ₺{formatMoney(totalExpense)}
          </strong>
        </article>

        <article className="report-card report-net">
          <div className="report-card-icon">
            <Wallet size={21} />
          </div>

          <span>Net Değişim</span>

          <strong
            className={
              netTotal >= 0
                ? "report-positive"
                : "report-negative"
            }
          >
            {netTotal >= 0 ? "+" : "-"}₺
            {formatMoney(
              Math.abs(netTotal)
            )}
          </strong>
        </article>
      </div>

      <section className="report-transactions">
        <h2>{periodTitle} Yapılan İşlemler</h2>

        {reportTransactions.length ===
        0 ? (
          <div className="report-empty">
            Bu dönemde herhangi bir işlem
            bulunmuyor.
          </div>
        ) : (
          <div className="report-list">
            {reportTransactions.map(
              (transaction) => (
                <article
                  className="report-transaction"
                  key={transaction.id}
                >
                  <div>
                    <strong>
                      {transaction.description}
                    </strong>

                    <time>
                      {new Date(
                        transaction.createdAt
                      ).toLocaleString(
                        "tr-TR",
                        {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </time>
                  </div>

                  <b
                    className={
                      transaction.type ===
                      "income"
                        ? "report-positive"
                        : "report-negative"
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
                  </b>
                </article>
              )
            )}
          </div>
        )}
      </section>
    </section>
  );
}

export default ReportsPage;