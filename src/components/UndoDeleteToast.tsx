import {
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
import { useEffect } from "react";

import "../styles/UndoDeleteToast.css";

import type { Transaction } from "../types/Transaction";

type Props = {
  transaction: Transaction | null;
  duration?: number;

  onUndo: (
    transaction: Transaction
  ) => void | Promise<void>;

  onDismiss: () => void;
};

function UndoDeleteToast({
  transaction,
  duration = 7000,
  onUndo,
  onDismiss,
}: Props) {
  useEffect(() => {
    if (!transaction) return;

    const timeout = window.setTimeout(
      onDismiss,
      duration
    );

    return () => {
      window.clearTimeout(timeout);
    };
  }, [
    transaction,
    duration,
    onDismiss,
  ]);

  if (!transaction) return null;

  return (
    <aside className="undo-toast">
      <div className="undo-toast-icon">
        <Trash2 size={18} />
      </div>

      <div className="undo-toast-content">
        <strong>İşlem silindi</strong>

        <span>
          {transaction.description}
        </span>
      </div>

      <button
        type="button"
        className="undo-toast-action"
        onClick={() =>
          void onUndo(transaction)
        }
      >
        <RotateCcw size={17} />
        Geri Al
      </button>

      <button
        type="button"
        className="undo-toast-close"
        onClick={onDismiss}
        aria-label="Bildirimi kapat"
      >
        <X size={17} />
      </button>
    </aside>
  );
}

export default UndoDeleteToast;