import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";

import {
  useMemo,
  useState,
} from "react";

import "../styles/ReportsPage.css";

import DayEndHistory from "../components/DayEndHistory";
import MonthlyChart from "../components/MonthlyChart";
import ReportExportActions from "../components/ReportExportActions";

import type { DayEndRecord } from "../types/DayEndRecord";
import type { Transaction } from "../types/Transaction";

type ReportPeriod =
  | "daily"
  | "weekly"
  | "monthly";

type Props = {
  transactions: Transaction[];
  dayEnds: DayEndRecord[];
};

type PeriodRange = {
  start: number;
  end: number;
  previousStart: number;
  previousEnd: number;
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

function getMonday(
  date: Date
): Date {
  const result =
    new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );

  const day =
    result.getDay() === 0
      ? 7
      : result.getDay();

  result.setDate(
    result.getDate() -
      day +
      1
  );

  return result;
}

function getPeriodRange(
  period: ReportPeriod
): PeriodRange {
  const now = new Date();

  if (period === "daily") {
    const start =
      new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );

    const end =
      new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1
      );

    const previousStart =
      new Date(start);

    previousStart.setDate(
      previousStart.getDate() - 1
    );

    return {
      start: start.getTime(),
      end: end.getTime(),

      previousStart:
        previousStart.getTime(),

      previousEnd:
        start.getTime(),
    };
  }

  if (period === "weekly") {
    const start =
      getMonday(now);

    const end =
      new Date(start);

    end.setDate(
      end.getDate() + 7
    );

    const previousStart =
      new Date(start);

    previousStart.setDate(
      previousStart.getDate() -
        7
    );

    return {
      start: start.getTime(),
      end: end.getTime(),

      previousStart:
        previousStart.getTime(),

      previousEnd:
        start.getTime(),
    };
  }

  const start =
    new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    );

  const end =
    new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      1
    );

  const previousStart =
    new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1
    );

  return {
    start: start.getTime(),
    end: end.getTime(),

    previousStart:
      previousStart.getTime(),

    previousEnd:
      start.getTime(),
  };
}

function calculateTotals(
  transactions: Transaction[]
) {
  const income =
    transactions
      .filter(
        (transaction) =>
          transaction.type ===
          "income"
      )
      .reduce(
        (total, transaction) =>
          total +
          transaction.amount,
        0
      );

  const expense =
    transactions
      .filter(
        (transaction) =>
          transaction.type ===
          "expense"
      )
      .reduce(
        (total, transaction) =>
          total +
          transaction.amount,
        0
      );

  return {
    income,
    expense,
    net: income - expense,
  };
}

function calculateChange(
  current: number,
  previous: number
): number | null {
  if (previous === 0) {
    return current === 0
      ? 0
      : null;
  }

  return (
    ((current - previous) /
      Math.abs(previous)) *
    100
  );
}

function ComparisonValue({
  current,
  previous,
}: {
  current: number;
  previous: number;
}) {
  const change =
    calculateChange(
      current,
      previous
    );

  if (change === null) {
    return (
      <span className="comparison-neutral">
        Önceki dönemde kayıt yok
      </span>
    );
  }

  const positive =
    change >= 0;

  return (
    <span
      className={
        positive
          ? "comparison-positive"
          : "comparison-negative"
      }
    >
      {positive ? (
        <TrendingUp size={15} />
      ) : (
        <TrendingDown size={15} />
      )}

      %{Math.abs(change).toLocaleString(
        "tr-TR",
        {
          maximumFractionDigits: 1,
        }
      )}

      {positive
        ? " artış"
        : " azalış"}
    </span>
  );
}

function ReportsPage({
  transactions,
  dayEnds,
}: Props) {
  const [
    period,
    setPeriod,
  ] = useState<ReportPeriod>(
    "daily"
  );

  const range =
    useMemo(
      () =>
        getPeriodRange(
          period
        ),
      [period]
    );

  const reportTransactions =
    useMemo(() => {
      return transactions.filter(
        (transaction) =>
          transaction.createdAt >=
            range.start &&
          transaction.createdAt <
            range.end
      );
    }, [
      transactions,
      range,
    ]);

  const previousTransactions =
    useMemo(() => {
      return transactions.filter(
        (transaction) =>
          transaction.createdAt >=
            range.previousStart &&
          transaction.createdAt <
            range.previousEnd
      );
    }, [
      transactions,
      range,
    ]);

  const currentTotals =
    useMemo(
      () =>
        calculateTotals(
          reportTransactions
        ),
      [reportTransactions]
    );

  const previousTotals =
    useMemo(
      () =>
        calculateTotals(
          previousTransactions
        ),
      [previousTransactions]
    );

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
          Gelir ve gider durumunu
          dönemlere göre karşılaştır.
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
          {reportTransactions.length}{" "}
          işlem
        </small>
      </div>

      <ReportExportActions
        transactions={
          reportTransactions
        }
        title={periodTitle}
      />

      <div className="report-summary-grid">
        <article className="report-card report-income">
          <div className="report-card-icon">
            <ArrowUpRight size={21} />
          </div>

          <span>Toplam Gelir</span>

          <strong>
            ₺
            {formatMoney(
              currentTotals.income
            )}
          </strong>
        </article>

        <article className="report-card report-expense">
          <div className="report-card-icon">
            <ArrowDownRight size={21} />
          </div>

          <span>Toplam Gider</span>

          <strong>
            ₺
            {formatMoney(
              currentTotals.expense
            )}
          </strong>
        </article>

        <article className="report-card report-net">
          <div className="report-card-icon">
            <Wallet size={21} />
          </div>

          <span>Net Değişim</span>

          <strong
            className={
              currentTotals.net >= 0
                ? "report-positive"
                : "report-negative"
            }
          >
            {currentTotals.net >= 0
              ? "+"
              : "-"}
            ₺
            {formatMoney(
              Math.abs(
                currentTotals.net
              )
            )}
          </strong>
        </article>
      </div>

      <section className="comparison-section">
        <div className="comparison-heading">
          <h2>
            Önceki Dönemle Karşılaştırma
          </h2>

          <span>
            Önceki dönemde{" "}
            {previousTransactions.length}{" "}
            işlem
          </span>
        </div>

        <div className="comparison-grid">
          <article>
            <span>Gelir</span>

            <strong>
              ₺
              {formatMoney(
                previousTotals.income
              )}
            </strong>

            <ComparisonValue
              current={
                currentTotals.income
              }
              previous={
                previousTotals.income
              }
            />
          </article>

          <article>
            <span>Gider</span>

            <strong>
              ₺
              {formatMoney(
                previousTotals.expense
              )}
            </strong>

            <ComparisonValue
              current={
                currentTotals.expense
              }
              previous={
                previousTotals.expense
              }
            />
          </article>

          <article>
            <span>Net</span>

            <strong>
              ₺
              {formatMoney(
                previousTotals.net
              )}
            </strong>

            <ComparisonValue
              current={
                currentTotals.net
              }
              previous={
                previousTotals.net
              }
            />
          </article>
        </div>
      </section>

      <MonthlyChart
        transactions={transactions}
      />

      <section className="report-transactions">
        <h2>
          {periodTitle} Yapılan
          İşlemler
        </h2>

        {reportTransactions.length ===
        0 ? (
          <div className="report-empty">
            Bu dönemde herhangi bir
            işlem bulunmuyor.
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
                      {
                        transaction.description
                      }
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

      <DayEndHistory
        records={dayEnds}
      />
    </section>
  );
}

export default ReportsPage;