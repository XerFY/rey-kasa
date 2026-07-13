import { useEffect } from "react";

import {
  CalendarClock,
  PencilLine,
  Trash2,
  TriangleAlert,
  X,
} from "lucide-react";

import "../styles/ClosedDayWarningModal.css";

import type { Transaction } from "../types/Transaction";

type ClosedDayAction =
  | "edit"
  | "delete";

type Props = {
  action: ClosedDayAction | null;
  transaction: Transaction | null;
  onClose: () => void;
  onConfirm: () => void;
};

function ClosedDayWarningModal({
  action,
  transaction,
  onClose,
  onConfirm,
}: Props) {
  const open =
    action !== null &&
    transaction !== null;

  useEffect(() => {
    if (!open) return;

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, [open]);

  if (!open || !action || !transaction) {
    return null;
  }

  const editing =
    action === "edit";

  return (
    <div
      className="closed-day-overlay"
      onClick={onClose}
    >
      <section
        className="closed-day-warning"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <button
          type="button"
          className="closed-day-close"
          onClick={onClose}
          aria-label="Kapat"
        >
          <X size={20} />
        </button>

        <div className="closed-day-warning-icon">
          <TriangleAlert size={27} />
        </div>

        <span className="closed-day-label">
          KAPATILMIŞ GÜN
        </span>

        <h2>
          {editing
            ? "İşlem düzenlenecek"
            : "İşlem silinecek"}
        </h2>

        <p>
          Bu işlem kapatılmış bir güne
          ait. Devam edersen geçmiş gün
          sonu raporu otomatik olarak
          güncellenecek.
        </p>

        <div className="closed-day-transaction">
          <CalendarClock size={19} />

          <div>
            <strong>
              {transaction.description}
            </strong>

            <span>
              {transaction.type ===
              "income"
                ? "+"
                : "-"}
              ₺
              {transaction.amount.toLocaleString(
                "tr-TR",
                {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }
              )}
            </span>
          </div>
        </div>

        <div className="closed-day-actions">
          <button
            type="button"
            className="closed-day-cancel"
            onClick={onClose}
          >
            Vazgeç
          </button>

          <button
            type="button"
            className={
              editing
                ? "closed-day-confirm-edit"
                : "closed-day-confirm-delete"
            }
            onClick={onConfirm}
          >
            {editing ? (
              <PencilLine size={18} />
            ) : (
              <Trash2 size={18} />
            )}

            {editing
              ? "Düzenlemeye Devam Et"
              : "Silmeye Devam Et"}
          </button>
        </div>
      </section>
    </div>
  );
}

export default ClosedDayWarningModal;