import {
  useEffect,
  useState,
  type FormEvent,
} from "react";
import { X } from "lucide-react";

import "../styles/EditTransactionModal.css";

import type { Transaction } from "../types/Transaction";

type Props = {
  open: boolean;
  transaction: Transaction | null;
  saving: boolean;
  onClose: () => void;
  onSave: (
    id: string,
    type: Transaction["type"],
    amount: number,
    description: string
  ) => void | Promise<void>;
};

function EditTransactionModal({
  open,
  transaction,
  saving,
  onClose,
  onSave,
}: Props) {
  const [type, setType] =
    useState<Transaction["type"]>("income");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!open || !transaction) return;

    setType(transaction.type);
    setAmount(String(transaction.amount));
    setDescription(transaction.description);
  }, [open, transaction]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open || !transaction) {
    return null;
  }

  const currentTransaction = transaction;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedAmount = amount
      .replace(/\./g, "")
      .replace(",", ".");

    const numericAmount = Number(normalizedAmount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return;
    }

    await onSave(
      currentTransaction.id,
      type,
      numericAmount,
      description.trim() ||
        (type === "income" ? "Gelir" : "Gider")
    );
  }

  return (
    <div className="edit-overlay" onClick={onClose}>
      <section
        className="edit-sheet"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="edit-handle" />

        <header className="edit-header">
          <div>
            <span>İşlem Kaydı</span>
            <h2>İşlemi Düzenle</h2>
          </div>

          <button
            type="button"
            className="edit-close"
            onClick={onClose}
            disabled={saving}
            aria-label="Kapat"
          >
            <X size={20} />
          </button>
        </header>

        <form onSubmit={handleSubmit}>
          <label className="edit-label">
            İşlem Türü
          </label>

          <div className="edit-type-selector">
            <button
              type="button"
              className={
                type === "income" ? "selected-income" : ""
              }
              onClick={() => setType("income")}
            >
              Gelir
            </button>

            <button
              type="button"
              className={
                type === "expense" ? "selected-expense" : ""
              }
              onClick={() => setType("expense")}
            >
              Gider
            </button>
          </div>

          <label className="edit-label" htmlFor="edit-amount">
            Tutar
          </label>

          <div className="edit-amount">
            <span>₺</span>

            <input
              id="edit-amount"
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              autoComplete="off"
            />
          </div>

          <label
            className="edit-label"
            htmlFor="edit-description"
          >
            Açıklama
          </label>

          <input
            id="edit-description"
            className="edit-description"
            type="text"
            value={description}
            onChange={(event) =>
              setDescription(event.target.value)
            }
            maxLength={80}
            autoComplete="off"
          />

          <div className="edit-actions">
            <button
              type="submit"
              className="edit-save"
              disabled={saving}
            >
              {saving
                ? "Kaydediliyor..."
                : "Değişiklikleri Kaydet"}
            </button>

            <button
              type="button"
              className="edit-cancel"
              onClick={onClose}
              disabled={saving}
            >
              Vazgeç
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default EditTransactionModal;