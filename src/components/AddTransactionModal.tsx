import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { X } from "lucide-react";

import "../styles/Modal.css";

type Props = {
  open: boolean;
  type: "income" | "expense";
  quickDescriptions: string[];
  onClose: () => void;
  onSave: (
    amount: number,
    description: string
  ) => void | Promise<void>;
};

function AddTransactionModal({
  open,
  type,
  quickDescriptions,
  onClose,
  onSave,
}: Props) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  const sheetRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;

    setAmount("");
    setDescription("");

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function updateKeyboardHeight() {
      const viewport = window.visualViewport;

      if (!viewport) return;

      const keyboardHeight =
        window.innerHeight - viewport.height - viewport.offsetTop;

      document.documentElement.style.setProperty(
        "--keyboard-height",
        `${Math.max(0, keyboardHeight)}px`
      );
    }

    updateKeyboardHeight();

    window.visualViewport?.addEventListener(
      "resize",
      updateKeyboardHeight
    );

    window.visualViewport?.addEventListener(
      "scroll",
      updateKeyboardHeight
    );

    return () => {
      document.body.style.overflow = previousOverflow;

      document.documentElement.style.setProperty(
        "--keyboard-height",
        "0px"
      );

      window.visualViewport?.removeEventListener(
        "resize",
        updateKeyboardHeight
      );

      window.visualViewport?.removeEventListener(
        "scroll",
        updateKeyboardHeight
      );
    };
  }, [open]);

  if (!open) return null;

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
      numericAmount,
      description.trim() || (type === "income" ? "Gelir" : "Gider")
    );
  }

  function handleInputFocus() {
    window.setTimeout(() => {
      sheetRef.current?.scrollTo({
        top: sheetRef.current.scrollHeight,
        behavior: "smooth",
      });
    }, 250);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <section
        ref={sheetRef}
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
          <div className="modal-fields">
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
                onFocus={handleInputFocus}
                autoComplete="off"
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
              onFocus={handleInputFocus}
              maxLength={80}
              autoComplete="off"
            />
          </div>

          <div className="modal-actions">
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
          </div>
        </form>
      </section>
    </div>
  );
}

export default AddTransactionModal;