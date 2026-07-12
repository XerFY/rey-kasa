import {
  ArrowDownRight,
  ArrowUpRight,
  Wallet,
} from "lucide-react";

import "../styles/DailySummary.css";

import type { Transaction } from "../types/Transaction";

type Props = {
  transactions: Transaction[];
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

function DailySummary({
  transactions,
}: Props) {
  const totalIncome =
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

  const totalExpense =
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

  const net =
    totalIncome - totalExpense;

  return (
    <section className="daily-summary">
      <article>
        <ArrowUpRight size={18} />

        <span>Bugünkü Gelir</span>

        <strong className="daily-income">
          ₺{formatMoney(totalIncome)}
        </strong>
      </article>

      <article>
        <ArrowDownRight size={18} />

        <span>Bugünkü Gider</span>

        <strong className="daily-expense">
          ₺{formatMoney(totalExpense)}
        </strong>
      </article>

      <article>
        <Wallet size={18} />

        <span>Bugünkü Net</span>

        <strong
          className={
            net >= 0
              ? "daily-income"
              : "daily-expense"
          }
        >
          {net >= 0 ? "+" : "-"}₺
          {formatMoney(
            Math.abs(net)
          )}
        </strong>
      </article>
    </section>
  );
}

export default DailySummary;