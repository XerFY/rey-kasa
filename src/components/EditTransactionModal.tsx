import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";

import {
  ArrowDownRight,
  ArrowUpRight,
  CircleCheck,
  PencilLine,
  X,
} from "lucide-react";

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

  const [amount, setAmount] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [validationError, setValidationError] =
    useState("");

  const sheetRef =
    useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open || !transaction) return;

    setType(transaction.type);
    setAmount(String(transaction.amount));
    setDescription(transaction.description);
    setValidationError("");
  }, [open, transaction]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    function updateKeyboardHeight() {
      const viewport =
        window.visualViewport;

      if (!viewport) return;

      const keyboardHeight =
        window.innerHeight -
        viewport.height -
        viewport.offsetTop;

      document.documentElement.style.setProperty(
        "--edit-keyboard-height",
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
      document.body.style.overflow =
        previousOverflow;

      document.documentElement.style.setProperty(
        "--edit-keyboard-height",
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

  if (!open || !transaction) {
    return null;
  }

  const currentTransaction = transaction;

  function handleClose() {
    if (!saving) {
      onClose();
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (saving) return;

    const normalizedAmount = amount
      .replace(/\./g, "")
      .replace(",", ".");

    const numericAmount =
      Number(normalizedAmount);

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      setValidationError(
        "Geçerli bir tutar gir."
      );

      return;
    }

    setValidationError("");

    await onSave(
      currentTransaction.id,
      type,
      numericAmount,
      description.trim() ||
        (type === "income"
          ? "Gelir"
          : "Gider")
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
    <div
      className="edit-overlay"
      onClick={handleClose}
    >
      <section
        ref={sheetRef}
        className={`edit-sheet edit-sheet-${type}`}
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <div className="edit-handle" />

        <header className="edit-header">
          <div className="edit-header-main">
            <div className="edit-header-icon">
              <PencilLine size={21} />
            </div>

            <div>
              <span>İŞLEM KAYDI</span>
              <h2>İşlemi Düzenle</h2>
            </div>
          </div>

          <button
            type="button"
            className="edit-close"
            onClick={handleClose}
            disabled={saving}
            aria-label="Kapat"
          >
            <X size={20} />
          </button>
        </header>

        <div className="edit-information">
          <CircleCheck size={17} />

          <span>
            Kaydettiğinde kasa ve raporlar
            otomatik güncellenecek.
          </span>
        </div>

        <form onSubmit={handleSubmit}>
          <label className="edit-label">
            İşlem Türü
          </label>

          <div className="edit-type-selector">
            <button
              type="button"
              className={
                type === "income"
                  ? "selected-income"
                  : ""
              }
              onClick={() => {
                setType("income");
                setValidationError("");
              }}
              disabled={saving}
              aria-pressed={
                type === "income"
              }
            >
              <ArrowUpRight size={20} />

              <span>
                <strong>Gelir</strong>
                <small>Para girişi</small>
              </span>
            </button>

            <button
              type="button"
              className={
                type === "expense"
                  ? "selected-expense"
                  : ""
              }
              onClick={() => {
                setType("expense");
                setValidationError("");
              }}
              disabled={saving}
              aria-pressed={
                type === "expense"
              }
            >
              <ArrowDownRight size={20} />

              <span>
                <strong>Gider</strong>
                <small>Para çıkışı</small>
              </span>
            </button>
          </div>

          <label
            className="edit-label"
            htmlFor="edit-amount"
          >
            Tutar
          </label>

          <div className="edit-amount">
            <span>₺</span>

            <input
              id="edit-amount"
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(event) => {
                setAmount(
                  event.target.value
                );

                setValidationError("");
              }}
              onFocus={handleInputFocus}
              placeholder="0,00"
              autoComplete="off"
              disabled={saving}
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
              setDescription(
                event.target.value
              )
            }
            onFocus={handleInputFocus}
            placeholder="İşlem açıklaması"
            maxLength={80}
            autoComplete="off"
            disabled={saving}
          />

          {validationError && (
            <div className="edit-error">
              {validationError}
            </div>
          )}

          <div className="edit-actions">
            <button
              type="submit"
              className={`edit-save edit-save-${type}`}
              disabled={saving}
            >
              <PencilLine size={19} />

              {saving
                ? "Kaydediliyor..."
                : "Değişiklikleri Kaydet"}
            </button>

            <button
              type="button"
              className="edit-cancel"
              onClick={handleClose}
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