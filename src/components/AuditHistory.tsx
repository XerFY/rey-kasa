import {
  ChevronDown,
  ChevronUp,
  FileClock,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import "../styles/AuditHistory.css";

import {
  listenAuditLogs,
} from "../services/transactionService";

import type {
  AuditAction,
  AuditLog,
} from "../types/AuditLog";

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

function getActionInformation(
  action: AuditAction
) {
  if (action === "create") {
    return {
      label: "İşlem eklendi",
      className: "audit-create",
      icon: Plus,
    };
  }

  if (action === "update") {
    return {
      label: "İşlem düzenlendi",
      className: "audit-update",
      icon: Pencil,
    };
  }

  if (action === "delete") {
    return {
      label: "İşlem silindi",
      className: "audit-delete",
      icon: Trash2,
    };
  }

  return {
    label: "İşlem geri getirildi",
    className: "audit-restore",
    icon: RotateCcw,
  };
}

function AuditHistory() {
  const [logs, setLogs] =
    useState<AuditLog[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [
    expandedLogId,
    setExpandedLogId,
  ] = useState<string | null>(
    null
  );

  useEffect(() => {
    const unsubscribe =
      listenAuditLogs(
        (records) => {
          setLogs(records);
          setLoading(false);
          setError("");
        },
        (listenError) => {
          setLoading(false);

          setError(
            `Geçmiş yüklenemedi: ${listenError.message}`
          );
        }
      );

    return unsubscribe;
  }, []);

  return (
    <article className="settings-card audit-history">
      <div className="settings-card-title">
        <div className="settings-card-icon">
          <FileClock size={22} />
        </div>

        <div>
          <h2>İşlem Geçmişi</h2>

          <p>
            Eklenen, düzenlenen, silinen ve
            geri getirilen son 100 işlem.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="audit-empty">
          Geçmiş yükleniyor...
        </div>
      ) : error ? (
        <div className="audit-error">
          {error}
        </div>
      ) : logs.length === 0 ? (
        <div className="audit-empty">
          Henüz işlem geçmişi bulunmuyor.
        </div>
      ) : (
        <div className="audit-list">
          {logs.map((log) => {
            const information =
              getActionInformation(
                log.action
              );

            const Icon =
              information.icon;

            const expanded =
              expandedLogId ===
              log.id;

            const visibleTransaction =
              log.after ??
              log.before;

            return (
              <article
                className="audit-item"
                key={log.id}
              >
                <button
                  type="button"
                  className="audit-item-header"
                  onClick={() =>
                    setExpandedLogId(
                      expanded
                        ? null
                        : log.id
                    )
                  }
                >
                  <div
                    className={`audit-action-icon ${information.className}`}
                  >
                    <Icon size={17} />
                  </div>

                  <div className="audit-item-content">
                    <strong>
                      {
                        information.label
                      }
                    </strong>

                    <span>
                      {visibleTransaction
                        ?.description ??
                        "İşlem bilgisi yok"}
                    </span>
                  </div>

                  <time>
                    {new Date(
                      log.createdAt
                    ).toLocaleString(
                      "tr-TR",
                      {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </time>

                  {expanded ? (
                    <ChevronUp
                      size={18}
                    />
                  ) : (
                    <ChevronDown
                      size={18}
                    />
                  )}
                </button>

                {expanded && (
                  <div className="audit-details">
                    {log.before && (
                      <div className="audit-detail-card">
                        <span>
                          Önceki Bilgi
                        </span>

                        <strong>
                          {log.before.type ===
                          "income"
                            ? "+"
                            : "-"}
                          ₺
                          {formatMoney(
                            log.before
                              .amount
                          )}
                        </strong>

                        <p>
                          {
                            log.before
                              .description
                          }
                        </p>
                      </div>
                    )}

                    {log.after && (
                      <div className="audit-detail-card">
                        <span>
                          Yeni Bilgi
                        </span>

                        <strong>
                          {log.after.type ===
                          "income"
                            ? "+"
                            : "-"}
                          ₺
                          {formatMoney(
                            log.after
                              .amount
                          )}
                        </strong>

                        <p>
                          {
                            log.after
                              .description
                          }
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </article>
  );
}

export default AuditHistory;