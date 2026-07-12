import TransactionList from "../components/TransactionList";
import type { Transaction } from "../types/Transaction";

type Props = {
  transactions: Transaction[];
  loading: boolean;
};

function TransactionsPage({
  transactions,
  loading,
}: Props) {
  return (
    <section className="page-section">
      <h1>İşlemler</h1>

      <p className="page-description">
        Tüm gelir ve gider kayıtları
      </p>

      <div className="transactions">
        <TransactionList
          transactions={transactions}
          loading={loading}
        />
      </div>
    </section>
  );
}

export default TransactionsPage;