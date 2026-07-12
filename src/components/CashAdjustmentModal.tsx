import {
  CheckCircle2,
  Scale,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import "../styles/CashAdjustmentModal.css";

type Props = {
  open: boolean;
  currentBalance: number;
  saving: boolean;
  onClose: () => void;
  onSave: (
    difference: number
  ) => void | Promise<void>;
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

function CashAdjustmentModal({
  open,
  currentBalance,
  saving,
  onClose,
  onSave,
}: Props) {
  const [actualAmount, setActualAmount] =
    useState("");

  const [confirmation, setConfirmation] =
    useState(false);

  const numericActualAmount =
    useMemo(() => {
      const normalized =
        actualAmount
          .replace(/\./g, "")
          .replace(",", ".");

      const value = Number(normalized);

      return Number.isFinite(value)
        ? value
        : null;
    }, [actualAmount]);

  const difference =
    numericActualAmount === null
      ? null
      : numericActualAmount -
        currentBalance;

  useEffect(() => {
    if (!open) return;

    setActualAmount("");
    setConfirmation(false);

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

  function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      difference === null ||
      Math.abs(difference) < 0.005
    ) {
      return;
    }

    setConfirmation(true);
  }

  async function handleConfirm() {
    if (difference === null) return;

    await onSave(difference);
  }

  return (
    <div
      className="adjustment-overlay"
      onClick={onClose}
    >
      <section
        className="adjustment-modal"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <header className="adjustment-header">
          <div className="adjustment-heading">
            <div className="adjustment-icon">
              <Scale size={23} />
            </div>

            <div>
              <span>Kasa Kontrolü</span>
              <h2>Kasa Düzelt</h2>
            </div>
          </div>

          <button
            type="button"
            className="adjustment-close"
            onClick={onClose}
            disabled={saving}
            aria-label="Kapat"
          >
            <X size={20} />
          </button>
        </header>

        <div className="system-balance">
          <span>Sistemdeki Kasa</span>

          <strong>
            ₺
            {formatMoney(
              currentBalance
            )}
          </strong>
        </div>

        <form onSubmit={handleSubmit}>
          <label
            className="adjustment-label"
            htmlFor="actual-balance"
          >
            Gerçekte Sayılan Kasa
          </label>

          <div className="adjustment-input">
            <span>₺</span>

            <input
              id="actual-balance"
              type="text"
              inputMode="decimal"
              placeholder="0,00"
              value={actualAmount}
              onChange={(event) => {
                setActualAmount(
                  event.target.value
                );

                setConfirmation(false);
              }}
              autoComplete="off"
              autoFocus
            />
          </div>

          {difference !== null && (
            <div
              className={`adjustment-difference ${
                difference > 0
                  ? "adjustment-positive"
                  : difference < 0
                    ? "adjustment-negative"
                    : ""
              }`}
            >
              <span>Kasa Farkı</span>

              <strong>
                {difference > 0
                  ? "+"
                  : difference < 0
                    ? "-"
                    : ""}
                ₺
                {formatMoney(
                  Math.abs(
                    difference
                  )
                )}
              </strong>
            </div>
          )}

          {!confirmation ? (
            <button
              type="submit"
              className="adjustment-continue"
              disabled={
                difference === null ||
                Math.abs(
                  difference
                ) < 0.005
              }
            >
              Devam Et
            </button>
          ) : (
            <div className="adjustment-confirmation">
              <CheckCircle2
                size={25}
              />

              <strong>
                Düzeltme kaydı
                oluşturulsun mu?
              </strong>

              <p>
                {difference !== null &&
                difference > 0
                  ? "Fark, gelir kaydı olarak eklenecek."
                  : "Fark, gider kaydı olarak eklenecek."}
              </p>

              <button
                type="button"
                className="adjustment-confirm"
                onClick={() =>
                  void handleConfirm()
                }
                disabled={saving}
              >
                {saving
                  ? "Kaydediliyor..."
                  : "Evet, Kasayı Düzelt"}
              </button>

              <button
                type="button"
                className="adjustment-cancel"
                onClick={() =>
                  setConfirmation(
                    false
                  )
                }
                disabled={saving}
              >
                Vazgeç
              </button>
            </div>
          )}
        </form>
      </section>
    </div>
  );
}

export default CashAdjustmentModal;