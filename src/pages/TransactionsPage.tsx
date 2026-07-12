import {
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
  | "month";

type Props = {
  transactions: Transaction[];
  loading: boolean;

  onEditTransaction: (
    transaction: Transaction
  ) => void;

  onDeleteTransaction: (
    transaction: Transaction
  ) => void;
};

function getDateFilterStart(
  filter: DateFilter
): number | null {
  const now = new Date();

  if (filter === "all") {
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

function TransactionsPage({
  transactions,
  loading,
  onEditTransaction,
  onDeleteTransaction,
}: Props) {
  const [searchText, setSearchText] =
    useState("");

  const [
    transactionFilter,
    setTransactionFilter,
  ] = useState<TransactionFilter>(
    "all"
  );

  const [
    dateFilter,
    setDateFilter,
  ] = useState<DateFilter>("all");

  const filteredTransactions =
    useMemo(() => {
      const normalizedSearch =
        searchText
          .trim()
          .toLocaleLowerCase(
            "tr-TR"
          );

      const dateStart =
        getDateFilterStart(
          dateFilter
        );

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

          const matchesDate =
            dateStart === null ||
            transaction.createdAt >=
              dateStart;

          return (
            matchesSearch &&
            matchesType &&
            matchesDate
          );
        }
      );
    }, [
      transactions,
      searchText,
      transactionFilter,
      dateFilter,
    ]);

  const filtersActive =
    searchText.trim() !== "" ||
    transactionFilter !== "all" ||
    dateFilter !== "all";

  function clearFilters() {
    setSearchText("");
    setTransactionFilter("all");
    setDateFilter("all");
  }

  return (
    <section className="transactions-page">
      <header className="transactions-page-header">
        <span>REY KASA</span>

        <h1>İşlemler</h1>

        <p>
          Tüm gelir ve gider kayıtlarını
          ara ve filtrele.
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
          <span>Tarih</span>
        </div>

        <div className="date-filter-buttons">
          <button
            type="button"
            className={
              dateFilter === "all"
                ? "active"
                : ""
            }
            onClick={() =>
              setDateFilter("all")
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
              setDateFilter("today")
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
              setDateFilter("week")
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
              setDateFilter("month")
            }
          >
            Bu Ay
          </button>
        </div>
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

      <div className="transactions">
        <TransactionList
          transactions={
            filteredTransactions
          }
          loading={loading}
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