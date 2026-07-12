import type { Transaction } from "../types/Transaction";

type Props = {
  transactions: Transaction[];
  loading?: boolean;
};

function TransactionList({
  transactions,
  loading = false,
}: Props) {
  if (loading) {
    return <div className="empty">İşlemler yükleniyor...</div>;
  }

  if (transactions.length === 0) {
    return <div className="empty">Henüz işlem bulunmuyor.</div>;
  }

  return (
    <>
      {transactions.map((transaction) => (
        <article className="transaction-item" key={transaction.id}>
          <div>
            <strong
              className={
                transaction.type === "income"
                  ? "income-text"
                  : "expense-text"
              }
            >
              {transaction.type === "income" ? "+" : "-"} ₺
              {transaction.amount.toLocaleString("tr-TR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </strong>

            <p>{transaction.description}</p>
          </div>

          <time dateTime={new Date(transaction.createdAt).toISOString()}>
            {new Date(transaction.createdAt).toLocaleString("tr-TR", {
              day: "2-digit",
              month: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </time>
        </article>
      ))}
    </>
  );
}

export default TransactionList;