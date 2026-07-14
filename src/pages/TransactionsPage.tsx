import {
  CalendarRange,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import {
  useMemo,
  useState,
} from "react";

import "../styles/TransactionsPage.css";

import TransactionList from "../components/TransactionList";

import type { Transaction } from "../types/Transaction";

type TransactionFilter =
  | "all"
  | "income"
  | "expense";

type DateFilter =
  | "all"
  | "today"
  | "week"
  | "month"
  | "custom";

type Props = {
  transactions: Transaction[];
  loading: boolean;
  saving: boolean;

  onEditTransaction: (
    transaction: Transaction
  ) => void;

  onDeleteTransaction: (
    transaction: Transaction
  ) => void;
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

function getQuickDateStart(
  filter: DateFilter
): number | null {
  const now = new Date();

  if (
    filter === "all" ||
    filter === "custom"
  ) {
    return null;
  }

  if (filter === "today") {
    return new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    ).getTime();
  }

  if (filter === "week") {
    const day =
      now.getDay() === 0
        ? 7
        : now.getDay();

    return new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - day + 1
    ).getTime();
  }

  return new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  ).getTime();
}

function parseLocalDate(
  value: string,
  endOfDay = false
): number | null {
  if (!value) {
    return null;
  }

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

  return new Date(
    year,
    month - 1,
    day,
    endOfDay ? 23 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 999 : 0
  ).getTime();
}

function TransactionsPage({
  transactions,
  loading,
  saving,
  onEditTransaction,
  onDeleteTransaction,
}: Props) {
  const [
    searchText,
    setSearchText,
  ] = useState("");

  const [
    transactionFilter,
    setTransactionFilter,
  ] = useState<TransactionFilter>(
    "all"
  );

  const [
    dateFilter,
    setDateFilter,
  ] = useState<DateFilter>("today");

  const [
    startDate,
    setStartDate,
  ] = useState("");

  const [
    endDate,
    setEndDate,
  ] = useState("");

  const filteredTransactions =
    useMemo(() => {
      const normalizedSearch =
        searchText
          .trim()
          .toLocaleLowerCase(
            "tr-TR"
          );

      const quickDateStart =
        getQuickDateStart(
          dateFilter
        );

      const customStart =
        dateFilter === "custom"
          ? parseLocalDate(
              startDate
            )
          : null;

      const customEnd =
        dateFilter === "custom"
          ? parseLocalDate(
              endDate,
              true
            )
          : null;

      return transactions.filter(
        (transaction) => {
          const matchesSearch =
            !normalizedSearch ||
            transaction.description
              .toLocaleLowerCase(
                "tr-TR"
              )
              .includes(
                normalizedSearch
              );

          const matchesType =
            transactionFilter ===
              "all" ||
            transaction.type ===
              transactionFilter;

          const matchesQuickDate =
            quickDateStart === null ||
            transaction.createdAt >=
              quickDateStart;

          const matchesCustomStart =
            customStart === null ||
            transaction.createdAt >=
              customStart;

          const matchesCustomEnd =
            customEnd === null ||
            transaction.createdAt <=
              customEnd;

          return (
            matchesSearch &&
            matchesType &&
            matchesQuickDate &&
            matchesCustomStart &&
            matchesCustomEnd
          );
        }
      );
    }, [
      transactions,
      searchText,
      transactionFilter,
      dateFilter,
      startDate,
      endDate,
    ]);

  const totalIncome =
    useMemo(() => {
      return filteredTransactions
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
    }, [filteredTransactions]);

  const totalExpense =
    useMemo(() => {
      return filteredTransactions
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
    }, [filteredTransactions]);

  const filtersActive =
    searchText.trim() !== "" ||
    transactionFilter !== "all" ||
    dateFilter !== "today" ||
    startDate !== "" ||
    endDate !== "";

  function clearFilters() {
    setSearchText("");
    setTransactionFilter("all");
    setDateFilter("today");
    setStartDate("");
    setEndDate("");
  }

  function selectDateFilter(
    filter: DateFilter
  ) {
    setDateFilter(filter);

    if (filter !== "custom") {
      setStartDate("");
      setEndDate("");
    }
  }

  return (
    <section className="transactions-page">
      <header className="transactions-page-header">
        <span>REY KASA</span>

        <h1>İşlemler</h1>

        <p>
          Tüm gelir ve gider
          kayıtlarını ara ve filtrele.
        </p>
      </header>

      <div className="transaction-search">
        <Search size={19} />

        <input
          type="search"
          placeholder="Açıklamada ara..."
          value={searchText}
          onChange={(event) =>
            setSearchText(
              event.target.value
            )
          }
        />

        {searchText && (
          <button
            type="button"
            onClick={() =>
              setSearchText("")
            }
            aria-label="Aramayı temizle"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <div className="filter-section">
        <div className="filter-title">
          <div>
            <SlidersHorizontal
              size={17}
            />

            <span>İşlem Türü</span>
          </div>
        </div>

        <div className="filter-buttons">
          <button
            type="button"
            className={
              transactionFilter ===
              "all"
                ? "active"
                : ""
            }
            onClick={() =>
              setTransactionFilter(
                "all"
              )
            }
          >
            Tümü
          </button>

          <button
            type="button"
            className={
              transactionFilter ===
              "income"
                ? "active income-active"
                : ""
            }
            onClick={() =>
              setTransactionFilter(
                "income"
              )
            }
          >
            Gelir
          </button>

          <button
            type="button"
            className={
              transactionFilter ===
              "expense"
                ? "active expense-active"
                : ""
            }
            onClick={() =>
              setTransactionFilter(
                "expense"
              )
            }
          >
            Gider
          </button>
        </div>
      </div>

      <div className="filter-section">
        <div className="filter-title">
          <div>
            <CalendarRange
              size={17}
            />

            <span>Tarih</span>
          </div>
        </div>

        <div className="date-filter-buttons date-filter-five">
          <button
            type="button"
            className={
              dateFilter === "all"
                ? "active"
                : ""
            }
            onClick={() =>
              selectDateFilter("all")
            }
          >
            Tümü
          </button>

          <button
            type="button"
            className={
              dateFilter === "today"
                ? "active"
                : ""
            }
            onClick={() =>
              selectDateFilter(
                "today"
              )
            }
          >
            Bugün
          </button>

          <button
            type="button"
            className={
              dateFilter === "week"
                ? "active"
                : ""
            }
            onClick={() =>
              selectDateFilter(
                "week"
              )
            }
          >
            Bu Hafta
          </button>

          <button
            type="button"
            className={
              dateFilter === "month"
                ? "active"
                : ""
            }
            onClick={() =>
              selectDateFilter(
                "month"
              )
            }
          >
            Bu Ay
          </button>

          <button
            type="button"
            className={
              dateFilter === "custom"
                ? "active"
                : ""
            }
            onClick={() =>
              selectDateFilter(
                "custom"
              )
            }
          >
            Özel
          </button>
        </div>

        {dateFilter === "custom" && (
          <div className="custom-date-area">
            <label>
              <span>Başlangıç</span>

              <input
                type="date"
                value={startDate}
                onChange={(event) =>
                  setStartDate(
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
                  startDate ||
                  undefined
                }
                value={endDate}
                onChange={(event) =>
                  setEndDate(
                    event.target.value
                  )
                }
              />
            </label>
          </div>
        )}
      </div>

      <div className="transaction-results-heading">
        <span>
          {loading
            ? "Yükleniyor..."
            : `${filteredTransactions.length} işlem bulundu`}
        </span>

        {filtersActive && (
          <button
            type="button"
            onClick={clearFilters}
          >
            Filtreleri Temizle
          </button>
        )}
      </div>

      {!loading && (
        <div className="filtered-summary">
          <div>
            <span>Gelir</span>

            <strong className="filtered-income">
              ₺
              {formatMoney(
                totalIncome
              )}
            </strong>
          </div>

          <div>
            <span>Gider</span>

            <strong className="filtered-expense">
              ₺
              {formatMoney(
                totalExpense
              )}
            </strong>
          </div>

          <div>
            <span>Net</span>

            <strong
              className={
                totalIncome -
                  totalExpense >=
                0
                  ? "filtered-income"
                  : "filtered-expense"
              }
            >
              {totalIncome -
                totalExpense >=
              0
                ? "+"
                : "-"}
              ₺
              {formatMoney(
                Math.abs(
                  totalIncome -
                    totalExpense
                )
              )}
            </strong>
          </div>
        </div>
      )}

      <div className="transactions">
        <TransactionList
          transactions={
            filteredTransactions
          }
          loading={loading}
          disabled={saving}
          onEdit={
            onEditTransaction
          }
          onDelete={
            onDeleteTransaction
          }
        />
      </div>
    </section>
  );
}

export default TransactionsPage;
