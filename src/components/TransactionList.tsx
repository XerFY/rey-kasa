import { useEffect, useRef, useState } from "react";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";

import type { Transaction } from "../types/Transaction";

type Props = {
  transactions: Transaction[];
  loading?: boolean;
  disabled?: boolean;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
};

function TransactionList({
  transactions,
  loading = false,
  disabled = false,
  onEdit,
  onDelete,
}: Props) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      const target = event.target as Node;

      if (!menuAreaRef.current?.contains(target)) {
        setOpenMenuId(null);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  useEffect(() => {
    if (disabled) {
      setOpenMenuId(null);
    }
  }, [disabled]);

  if (loading) {
    return <div className="empty">İşlemler yükleniyor...</div>;
  }

  if (transactions.length === 0) {
    return <div className="empty">Henüz işlem bulunmuyor.</div>;
  }

  return (
    <>
      {transactions.map((transaction) => {
        const menuOpen = openMenuId === transaction.id;
        const transactionDate =
          new Date(transaction.createdAt);
        const dateIsValid =
          Number.isFinite(
            transactionDate.getTime()
          );

        return (
          <article className="transaction-item" key={transaction.id}>
            <div className="transaction-content">
              <strong
                className={
                  transaction.type === "income"
                    ? "income-text"
                    : "expense-text"
                }
              >
                {transaction.type === "income" ? "+" : "-"} ₺
                {transaction.amount.toLocaleString("tr-TR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </strong>

              <p>{transaction.description}</p>
            </div>

            <div className="transaction-right" ref={menuOpen ? menuAreaRef : null}>
              <time
                dateTime={
                  dateIsValid
                    ? transactionDate.toISOString()
                    : undefined
                }
              >
                {dateIsValid
                  ? transactionDate.toLocaleString(
                      "tr-TR",
                      {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )
                  : "Tarih bilinmiyor"}
              </time>

              <button
                type="button"
                className="transaction-menu-button"
                onClick={() =>
                  setOpenMenuId(menuOpen ? null : transaction.id)
                }
                aria-label="İşlem seçenekleri"
                disabled={disabled}
              >
                <MoreVertical size={20} />
              </button>

              {menuOpen && (
                <div className="transaction-menu">
                  <button
                    type="button"
                    onClick={() => {
                      setOpenMenuId(null);
                      onEdit(transaction);
                    }}
                  >
                    <Pencil size={17} />
                    Düzenle
                  </button>

                  <button
                    type="button"
                    className="transaction-delete-option"
                    onClick={() => {
                      setOpenMenuId(null);
                      onDelete(transaction);
                    }}
                  >
                    <Trash2 size={17} />
                    Sil
                  </button>
                </div>
              )}
            </div>
          </article>
        );
      })}
    </>
  );
}

export default TransactionList;
