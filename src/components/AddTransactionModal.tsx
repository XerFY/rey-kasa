import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react";
import { X } from "lucide-react";
import "../styles/Modal.css";

type TransactionType = "income" | "expense";

type Props = {
  open: boolean;
  type: TransactionType;
  onClose: () => void;
  onSave: (amount: number, description: string) => void;
};

type ModalViewportStyle = CSSProperties & {
  "--modal-height": string;
  "--modal-top": string;
};

function AddTransactionModal({
  open,
  type,
  onClose,
  onSave,
}: Props) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  const [viewport, setViewport] = useState({
    height: window.innerHeight,
    top: 0,
  });

  const amountInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    setAmount("");
    setDescription("");

    const scrollY = window.scrollY;

    const oldOverflow = document.body.style.overflow;
    const oldPosition = document.body.style.position;
    const oldTop = document.body.style.top;
    const oldWidth = document.body.style.width;

    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";

    function updateViewport() {
      const visualViewport = window.visualViewport;

      if (visualViewport) {
        setViewport({
          height: visualViewport.height,
          top: visualViewport.offsetTop,
        });

        return;
      }

      setViewport({
        height: window.innerHeight,
        top: 0,
      });
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    updateViewport();

    window.addEventListener("resize", updateViewport);
    window.addEventListener("orientationchange", updateViewport);
    window.addEventListener("keydown", handleKeyDown);

    window.visualViewport?.addEventListener(
      "resize",
      updateViewport
    );

    window.visualViewport?.addEventListener(
      "scroll",
      updateViewport
    );

    return () => {
      window.removeEventListener("resize", updateViewport);
      window.removeEventListener(
        "orientationchange",
        updateViewport
      );
      window.removeEventListener("keydown", handleKeyDown);

      window.visualViewport?.removeEventListener(
        "resize",
        updateViewport
      );

      window.visualViewport?.removeEventListener(
        "scroll",
        updateViewport
      );

      document.body.style.overflow = oldOverflow;
      document.body.style.position = oldPosition;
      document.body.style.top = oldTop;
      document.body.style.width = oldWidth;

      window.scrollTo(0, scrollY);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedAmount = amount
      .trim()
      .replace(/\s/g, "")
      .replace(",", ".");

    const numericAmount = Number(normalizedAmount);

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      amountInputRef.current?.focus();
      return;
    }

    onSave(
      numericAmount,
      description.trim() ||
        (type === "income" ? "Gelir" : "Gider")
    );
  }

  const modalStyle: ModalViewportStyle = {
    "--modal-height": `${viewport.height}px`,
    "--modal-top": `${viewport.top}px`,
  };

  return (
    <div
      className="modal-overlay"
      style={modalStyle}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        className="modal-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="transaction-modal-title"
      >
        <div
          className="modal-handle"
          aria-hidden="true"
        />

        <div className="modal-header">
          <div>
            <span className="modal-label">
              {type === "income"
                ? "Para Girişi"
                : "Para Çıkışı"}
            </span>

            <h2 id="transaction-modal-title">
              {type === "income"
                ? "Gelir Ekle"
                : "Gider Ekle"}
            </h2>
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

        <form
          className="transaction-form"
          onSubmit={handleSubmit}
        >
          <div className="modal-scroll-area">
            <label
              className="field-label"
              htmlFor="amount"
            >
              Tutar
            </label>

            <div className="amount-field">
              <span>₺</span>

              <input
                ref={amountInputRef}
                id="amount"
                name="amount"
                type="text"
                inputMode="decimal"
                enterKeyHint="next"
                autoComplete="off"
                placeholder="0,00"
                value={amount}
                onChange={(event) =>
                  setAmount(event.target.value)
                }
              />
            </div>

            <label
              className="field-label"
              htmlFor="description"
            >
              Açıklama
            </label>

            <input
              id="description"
              name="description"
              className="description-field"
              type="text"
              enterKeyHint="done"
              autoComplete="off"
              placeholder="İşlem açıklaması"
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              maxLength={80}
            />
          </div>

          <div className="modal-actions">
            <button
              type="submit"
              className={`save-button ${
                type === "income"
                  ? "save-income"
                  : "save-expense"
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