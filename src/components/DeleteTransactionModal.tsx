import { AlertTriangle, Trash2, X } from "lucide-react";

import "../styles/DeleteTransactionModal.css";

import type { Transaction } from "../types/Transaction";

type Props = {
  open: boolean;
  transaction: Transaction | null;
  deleting: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
};

function formatMoney(amount: number): string {
  return amount.toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function DeleteTransactionModal({
  open,
  transaction,
  deleting,
  onClose,
  onConfirm,
}: Props) {
  if (!open || !transaction) {
    return null;
  }

  return (
    <div
      className="delete-overlay"
      onClick={() => {
        if (!deleting) onClose();
      }}
    >
      <section
        className="delete-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="delete-close"
          onClick={onClose}
          disabled={deleting}
          aria-label="Kapat"
        >
          <X size={20} />
        </button>

        <div className="delete-icon">
          <AlertTriangle size={30} />
        </div>

        <h2>İşlem silinsin mi?</h2>

        <p className="delete-warning">
          Bu işlem kalıcı olarak silinecek ve kasa bakiyesi
          yeniden hesaplanacak.
        </p>

        <article className="delete-transaction-preview">
          <div>
            <span
              className={
                transaction.type === "income"
                  ? "delete-income"
                  : "delete-expense"
              }
            >
              {transaction.type === "income" ? "Gelir" : "Gider"}
            </span>

            <strong>{transaction.description}</strong>
          </div>

          <b
            className={
              transaction.type === "income"
                ? "delete-income"
                : "delete-expense"
            }
          >
            {transaction.type === "income" ? "+" : "-"}₺
            {formatMoney(transaction.amount)}
          </b>
        </article>

        <div className="delete-actions">
          <button
            type="button"
            className="delete-cancel"
            onClick={onClose}
            disabled={deleting}
          >
            Vazgeç
          </button>

          <button
            type="button"
            className="delete-confirm"
            onClick={() => void onConfirm()}
            disabled={deleting}
          >
            <Trash2 size={19} />

            {deleting ? "Siliniyor..." : "Evet, Sil"}
          </button>
        </div>
      </section>
    </div>
  );
}

export default DeleteTransactionModal;
