import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
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
import ReportExportActions from "../components/ReportExportActions";

import type { DayEndRecord } from "../types/DayEndRecord";
import type { Transaction } from "../types/Transaction";

type ReportPeriod =
  | "daily"
  | "weekly"
  | "monthly"
  | "custom";

type Props = {
  transactions: Transaction[];
  dayEnds: DayEndRecord[];
  currentDateKey: string;
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

function parseDateKey(
  value: string
): Date | null {
  const [year, month, day] =
    value
      .split("-")
      .map(Number);

  if (
    !year ||
    !month ||
    !day
  ) {
    return null;
  }

  const date = new Date(
    year,
    month - 1,
    day
  );

  if (
    date.getFullYear() !== year ||
    date.getMonth() !==
      month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function formatDateLabel(
  value: string
): string {
  const date = parseDateKey(value);

  if (!date) {
    return "Tarih seçilmedi";
  }

  return date.toLocaleDateString(
    "tr-TR",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  );
}

function getPeriodRange(
  period: ReportPeriod,
  currentDateKey: string,
  customStartDate: string,
  customEndDate: string
): PeriodRange | null {
  const now =
    parseDateKey(
      currentDateKey
    ) ?? new Date();

  if (period === "custom") {
    const start =
      parseDateKey(
        customStartDate
      );

    const selectedEnd =
      parseDateKey(
        customEndDate
      );

    if (
      !start ||
      !selectedEnd ||
      start.getTime() >
        selectedEnd.getTime()
    ) {
      return null;
    }

    const end =
      new Date(selectedEnd);

    end.setDate(
      end.getDate() + 1
    );

    const duration =
      end.getTime() -
      start.getTime();

    return {
      start: start.getTime(),
      end: end.getTime(),
      previousStart:
        start.getTime() -
        duration,
      previousEnd:
        start.getTime(),
    };
  }

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
  currentDateKey,
}: Props) {
  const [
    period,
    setPeriod,
  ] = useState<ReportPeriod>(
    "daily"
  );

  const [
    customStartDate,
    setCustomStartDate,
  ] = useState(currentDateKey);

  const [
    customEndDate,
    setCustomEndDate,
  ] = useState(currentDateKey);

  const range =
    useMemo(
      () =>
        getPeriodRange(
          period,
          currentDateKey,
          customStartDate,
          customEndDate
        ),
      [
        period,
        currentDateKey,
        customStartDate,
        customEndDate,
      ]
    );

  const reportTransactions =
    useMemo(() => {
      if (!range) {
        return [];
      }

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
      if (!range) {
        return [];
      }

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

  const customRangeError =
    period === "custom" &&
    !range;

  const periodTitle =
    period === "daily"
      ? "Bugün"
      : period === "weekly"
        ? "Bu Hafta"
        : period === "monthly"
          ? "Bu Ay"
          : customStartDate ===
              customEndDate
            ? formatDateLabel(
                customStartDate
              )
            : `${formatDateLabel(
                customStartDate
              )} - ${formatDateLabel(
                customEndDate
              )}`;

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

        <button
          type="button"
          className={
            period === "custom"
              ? "active"
              : ""
          }
          onClick={() =>
            setPeriod("custom")
          }
        >
          Tarih Seç
        </button>
      </div>

      {period === "custom" && (
        <section className="report-custom-range">
          <div className="report-custom-range-heading">
            <div>
              <span className="report-custom-range-icon">
                <CalendarRange
                  size={19}
                />
              </span>

              <div>
                <strong>
                  Geçmiş Rapor
                </strong>

                <span>
                  PDF veya CSV için
                  tarih aralığını seç.
                </span>
              </div>
            </div>

            <small>ÖZEL</small>
          </div>

          <div className="report-date-fields">
            <label>
              <span>Başlangıç</span>

              <input
                type="date"
                max={
                  customEndDate ||
                  currentDateKey
                }
                value={
                  customStartDate
                }
                onChange={(event) =>
                  setCustomStartDate(
                    event.target.value
                  )
                }
              />
            </label>

            <label>
              <span>Bitiş</span>

              <input
                type="date"
                min={
                  customStartDate ||
                  undefined
                }
                max={currentDateKey}
                value={customEndDate}
                onChange={(event) =>
                  setCustomEndDate(
                    event.target.value
                  )
                }
              />
            </label>
          </div>

          {customRangeError ? (
            <p
              className="report-date-error"
              role="alert"
            >
              Geçerli bir başlangıç ve
              bitiş tarihi seçin.
            </p>
          ) : (
            <div className="report-date-ready">
              <CheckCircle2
                size={16}
              />

              <span>
                Seçilen tarihler PDF ve
                CSV dosyasına uygulanacak.
              </span>
            </div>
          )}
        </section>
      )}

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

      <section className="report-transactions">
        <h2>
          {period === "custom"
            ? "Seçilen Tarihlerdeki İşlemler"
            : `${periodTitle} Yapılan İşlemler`}
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
