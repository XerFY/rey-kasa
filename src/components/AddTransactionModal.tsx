import {
  Check,
  Zap,
  X,
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";

import "../styles/Modal.css";

import type {
  QuickDescription,
} from "../types/AppSettings";

import {
  parseMoneyInput,
} from "../utils/moneyUtils";

type Props = {
  open: boolean;
  type: "income" | "expense";
  saving: boolean;

  quickDescriptions:
    QuickDescription[];

  onClose: () => void;

  onSave: (
    amount: number,
    description: string
  ) => Promise<void>;
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

function AddTransactionModal({
  open,
  type,
  saving,
  quickDescriptions,
  onClose,
  onSave,
}: Props) {
  const [amount, setAmount] =
    useState("");

  const [
    description,
    setDescription,
  ] = useState("");

  const sheetRef =
    useRef<HTMLElement>(null);

  const visibleDescriptions =
    quickDescriptions.filter(
      (item) =>
        item.type === type
    );

  useEffect(() => {
    if (!open) return;

    setAmount("");
    setDescription("");

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const numericAmount =
      parseMoneyInput(amount);

    if (
      numericAmount === null ||
      numericAmount <= 0
    ) {
      return;
    }

    await onSave(
      numericAmount,

      description.trim() ||
        (
          type === "income"
            ? "Gelir"
            : "Gider"
        )
    );
  }

function handleQuickDescription(
  item: QuickDescription
) {
  if (saving) return;

  setDescription(item.label);

  if (
    typeof item.amount === "number" &&
    item.amount > 0
  ) {
    void onSave(
      item.amount,
      item.label
    );
  }

  // Kullanıcının yazdığı tutar artık silinmez.
}

  function handleInputFocus() {
    window.setTimeout(() => {
      sheetRef.current?.scrollTo({
        top:
          sheetRef.current
            .scrollHeight,

        behavior: "smooth",
      });
    }, 250);
  }

  return (
    <div
      className="modal-overlay"
      onClick={() => {
        if (!saving) onClose();
      }}
    >
      <section
        ref={sheetRef}
        className="modal-sheet"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <div className="modal-handle" />

        <div className="modal-header">
          <div>
            <span className="modal-label">
              {type === "income"
                ? "Para Girişi"
                : "Para Çıkışı"}
            </span>

            <h2>
              {type === "income"
                ? "Gelir Ekle"
                : "Gider Ekle"}
            </h2>
          </div>

          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            disabled={saving}
            aria-label="Kapat"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-fields">
            <label
              className="field-label"
              htmlFor="amount"
            >
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
                onChange={(event) =>
                  setAmount(
                    event.target.value
                  )
                }
                onFocus={
                  handleInputFocus
                }
                autoComplete="off"
                autoFocus
                disabled={saving}
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
              className="description-field"
              type="text"
              placeholder="İşlem açıklaması"
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value
                )
              }
              onFocus={
                handleInputFocus
              }
              maxLength={80}
                autoComplete="off"
                disabled={saving}
            />

            {visibleDescriptions.length >
              0 && (
              <div className="quick-description-area">
                <span className="quick-description-title">
                  {type === "income"
                    ? "Gelir Açıklamaları"
                    : "Gider Açıklamaları"}
                </span>

                <div className="quick-description-list">
                  {visibleDescriptions.map(
                    (item) => {
                      const selected =
                        description ===
                        item.label;

                      const hasAmount =
                        typeof item.amount ===
                          "number" &&
                        item.amount > 0;

                      return (
                        <button
                          type="button"
                          key={item.id}
                          className={`quick-description-button ${
                            selected
                              ? "selected"
                              : ""
                          } ${
                            hasAmount
                              ? "quick-save-button"
                              : ""
                          }`}
                          onClick={() =>
                            handleQuickDescription(
                              item
                            )
                          }
                          disabled={saving}
                        >
                          {hasAmount ? (
                            <Zap size={15} />
                          ) : selected ? (
                            <Check
                              size={15}
                            />
                          ) : null}

                          <span>
                            {item.label}
                          </span>

                          {hasAmount && (
                            <b>
                              ₺
                              {formatMoney(
                                item.amount!
                              )}
                            </b>
                          )}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button
              type="submit"
              className={`save-button ${
                type === "income"
                  ? "save-income"
                  : "save-expense"
              }`}
              disabled={saving}
            >
              {saving
                ? "Kaydediliyor..."
                : "Kaydet"}
            </button>

            <button
              type="button"
              className="cancel-button"
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

export default AddTransactionModal;
