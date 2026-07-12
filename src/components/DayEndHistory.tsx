import {
  CalendarSearch,
  ChevronDown,
  ChevronUp,
  History,
  Printer,
  RotateCcw,
} from "lucide-react";

import {
  useMemo,
  useState,
} from "react";

import "../styles/DayEndHistory.css";

import {
  printDayEndReport,
} from "../services/printService";

import type { DayEndRecord } from "../types/DayEndRecord";

type Props = {
  records: DayEndRecord[];
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

function formatDateKey(
  dateKey: string
): string {
  const [year, month, day] =
    dateKey.split("-");

  return `${day}.${month}.${year}`;
}

function DayEndHistory({
  records,
}: Props) {
  const [
    expandedRecordId,
    setExpandedRecordId,
  ] = useState<string | null>(
    null
  );

  const [
    selectedDate,
    setSelectedDate,
  ] = useState("");

  const filteredRecords =
    useMemo(() => {
      if (!selectedDate) {
        return records;
      }

      return records.filter(
        (record) =>
          record.dateKey ===
          selectedDate
      );
    }, [
      records,
      selectedDate,
    ]);

  function toggleRecord(
    recordId: string
  ) {
    setExpandedRecordId(
      expandedRecordId ===
        recordId
        ? null
        : recordId
    );
  }

  return (
    <section className="day-end-history">
      <div className="history-heading">
        <div>
          <History size={20} />

          <h2>
            Geçmiş Gün Sonları
          </h2>
        </div>

        <span>
          {filteredRecords.length} kayıt
        </span>
      </div>

      <div className="history-filter">
        <div>
          <CalendarSearch
            size={19}
          />

          <label
            htmlFor="day-end-date"
          >
            Tarihe Göre Bul
          </label>
        </div>

        <input
          id="day-end-date"
          type="date"
          value={selectedDate}
          onChange={(event) => {
            setSelectedDate(
              event.target.value
            );

            setExpandedRecordId(
              null
            );
          }}
        />

        {selectedDate && (
          <button
            type="button"
            onClick={() => {
              setSelectedDate("");
              setExpandedRecordId(null);
            }}
          >
            <RotateCcw size={16} />
            Tümünü Göster
          </button>
        )}
      </div>

      {records.length === 0 ? (
        <div className="history-empty">
          Henüz arşivlenmiş gün sonu yok.
        </div>
      ) : filteredRecords.length ===
        0 ? (
        <div className="history-empty">
          Seçilen tarihte gün sonu
          kaydı bulunamadı.
        </div>
      ) : (
        <div className="history-list">
          {filteredRecords.map(
            (record) => {
              const expanded =
                expandedRecordId ===
                record.id;

              return (
                <article
                  className="history-card"
                  key={record.id}
                >
                  <button
                    type="button"
                    className="history-card-header"
                    onClick={() =>
                      toggleRecord(
                        record.id
                      )
                    }
                  >
                    <div>
                      <strong>
                        {formatDateKey(
                          record.dateKey
                        )}
                      </strong>

                      <small>
                        Kapanış:{" "}
                        {new Date(
                          record.closedAt
                        ).toLocaleTimeString(
                          "tr-TR",
                          {
                            hour:
                              "2-digit",

                            minute:
                              "2-digit",
                          }
                        )}
                      </small>
                    </div>

                    <div className="history-header-right">
                      <b>
                        ₺
                        {formatMoney(
                          record.balance
                        )}
                      </b>

                      {expanded ? (
                        <ChevronUp
                          size={20}
                        />
                      ) : (
                        <ChevronDown
                          size={20}
                        />
                      )}
                    </div>
                  </button>

                  <div className="history-quick-summary">
                    <span className="history-income">
                      +₺
                      {formatMoney(
                        record.totalIncome
                      )}
                    </span>

                    <span className="history-expense">
                      -₺
                      {formatMoney(
                        record.totalExpense
                      )}
                    </span>

                    <span>
                      {
                        record.transactionCount
                      }{" "}
                      işlem
                    </span>
                  </div>

                  {expanded && (
                    <div className="history-details">
                      <div className="history-summary-grid">
                        <div>
                          <span>Gelir</span>

                          <strong className="history-income">
                            ₺
                            {formatMoney(
                              record.totalIncome
                            )}
                          </strong>
                        </div>

                        <div>
                          <span>Gider</span>

                          <strong className="history-expense">
                            ₺
                            {formatMoney(
                              record.totalExpense
                            )}
                          </strong>
                        </div>

                        <div>
                          <span>Net</span>

                          <strong
                            className={
                              record.netTotal >=
                              0
                                ? "history-income"
                                : "history-expense"
                            }
                          >
                            {record.netTotal >=
                            0
                              ? "+"
                              : "-"}
                            ₺
                            {formatMoney(
                              Math.abs(
                                record.netTotal
                              )
                            )}
                          </strong>
                        </div>
                      </div>

                      <div className="history-transactions">
                        {record.transactions.map(
                          (
                            transaction
                          ) => (
                            <div
                              className="history-transaction"
                              key={
                                transaction.id
                              }
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
                                  ).toLocaleTimeString(
                                    "tr-TR",
                                    {
                                      hour:
                                        "2-digit",

                                      minute:
                                        "2-digit",
                                    }
                                  )}
                                </time>
                              </div>

                              <b
                                className={
                                  transaction.type ===
                                  "income"
                                    ? "history-income"
                                    : "history-expense"
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
                            </div>
                          )
                        )}
                      </div>

                      <button
                        type="button"
                        className="history-print"
                        onClick={() =>
                          printDayEndReport({
                            transactions:
                              record.transactions,

                            balance:
                              record.balance,
                          })
                        }
                      >
                        <Printer
                          size={19}
                        />

                        Yeniden Yazdır
                      </button>
                    </div>
                  )}
                </article>
              );
            }
          )}
        </div>
      )}
    </section>
  );
}

export default DayEndHistory;