import {
  AlertTriangle,
  X,
} from "lucide-react";

import "../styles/LargeTransactionModal.css";

type Props = {
  open: boolean;
  type: "income" | "expense";
  amount: number;
  description: string;

  onConfirm: () => void;
  onCancel: () => void;
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

function LargeTransactionModal({
  open,
  type,
  amount,
  description,
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null;

  return (
    <div
      className="large-warning-overlay"
      onClick={onCancel}
    >
      <section
        className="large-warning-modal"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <button
          type="button"
          className="large-warning-close"
          onClick={onCancel}
          aria-label="Kapat"
        >
          <X size={20} />
        </button>

        <div className="large-warning-icon">
          <AlertTriangle size={30} />
        </div>

        <h2>Büyük Tutar Uyarısı</h2>

        <p>
          Bu işlemin tutarı belirlenen
          uyarı sınırının üzerinde.
          Kaydetmeden önce bilgileri
          kontrol et.
        </p>

        <div className="large-warning-details">
          <span>
            {type === "income"
              ? "Gelir"
              : "Gider"}
          </span>

          <strong
            className={
              type === "income"
                ? "large-warning-income"
                : "large-warning-expense"
            }
          >
            {type === "income"
              ? "+"
              : "-"}
            ₺{formatMoney(amount)}
          </strong>

          <small>
            {description ||
              (type === "income"
                ? "Gelir"
                : "Gider")}
          </small>
        </div>

        <div className="large-warning-actions">
          <button
            type="button"
            className="large-warning-cancel"
            onClick={onCancel}
          >
            Vazgeç
          </button>

          <button
            type="button"
            className="large-warning-confirm"
            onClick={onConfirm}
          >
            Kontrol Ettim, Kaydet
          </button>
        </div>
      </section>
    </div>
  );
}

export default LargeTransactionModal;