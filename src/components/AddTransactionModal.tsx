import { useEffect, useState } from "react";
import { X } from "lucide-react";
import "../styles/Modal.css";

type Props = {
  open: boolean;
  type: "income" | "expense";
  onClose: () => void;
  onSave: (amount: number, description: string) => void;
};

function AddTransactionModal({
  open,
  type,
  onClose,
  onSave,
}: Props) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (open) {
      setAmount("");
      setDescription("");
    }
  }, [open]);

  if (!open) return null;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const numericAmount = Number(amount.replace(",", "."));

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return;
    }

    onSave(
      numericAmount,
      description.trim() || (type === "income" ? "Gelir" : "Gider")
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <section
        className="modal-sheet"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-handle" />

        <div className="modal-header">
          <div>
            <span className="modal-label">
              {type === "income" ? "Para Girişi" : "Para Çıkışı"}
            </span>

            <h2>{type === "income" ? "Gelir Ekle" : "Gider Ekle"}</h2>
          </div>

          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Kapat"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <label className="field-label" htmlFor="amount">
            Tutar
          </label>

          <div className="amount-field">
            <span>₺</span>

            <input
              id="amount"
              type="text"
              inputMode="decimal"
              placeholder="0,00"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              autoFocus
            />
          </div>

          <label className="field-label" htmlFor="description">
            Açıklama
          </label>

          <input
            id="description"
            className="description-field"
            type="text"
            placeholder="İşlem açıklaması"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={80}
          />

          <button
            type="submit"
            className={`save-button ${
              type === "income" ? "save-income" : "save-expense"
            }`}
          >
            Kaydet
          </button>

          <button
            type="button"
            className="cancel-button"
            onClick={onClose}
          >
            Vazgeç
          </button>
        </form>
      </section>
    </div>
  );
}

export default AddTransactionModal;