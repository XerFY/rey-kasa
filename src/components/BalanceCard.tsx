import "../styles/BalanceCard.css";

type Props = {
  balance: number;
  transactionCount: number;
  lastUpdate: string;
};

function BalanceCard({
  balance,
  transactionCount,
  lastUpdate,
}: Props) {
  return (
    <section className="balance-card">
      <div className="balance-top">
        <span className="balance-title">
          💰 Toplam Kasa
        </span>

        <h2>
          ₺ {balance.toLocaleString("tr-TR")}
        </h2>
      </div>

      <div className="balance-info">

        <div>
          <small>Bugünkü İşlem</small>
          <strong>{transactionCount}</strong>
        </div>

        <div>
          <small>Son Güncelleme</small>
          <strong>{lastUpdate}</strong>
        </div>

      </div>
    </section>
  );
}

export default BalanceCard;