import type { Transaction } from "../types/Transaction";

type PrintDayEndParams = {
  transactions: Transaction[];
  balance: number;
};
type ReceiptSettings = {
  businessName: string;
  businessPhone: string;
  receiptFooter: string;
};

function readReceiptSettings():
  ReceiptSettings {
  const fallback: ReceiptSettings = {
    businessName: "REY KASA",
    businessPhone: "",
    receiptFooter:
      "İyi çalışmalar",
  };

  try {
    const stored =
      localStorage.getItem(
        "rey-kasa-receipt-settings"
      );

    if (!stored) {
      return fallback;
    }

    const parsed =
      JSON.parse(stored) as Partial<
        ReceiptSettings
      >;

    return {
      businessName:
        typeof parsed.businessName ===
          "string" &&
        parsed.businessName.trim()
          ? parsed.businessName.trim()
          : fallback.businessName,

      businessPhone:
        typeof parsed.businessPhone ===
        "string"
          ? parsed.businessPhone.trim()
          : "",

      receiptFooter:
        typeof parsed.receiptFooter ===
          "string" &&
        parsed.receiptFooter.trim()
          ? parsed.receiptFooter.trim()
          : fallback.receiptFooter,
    };
  } catch {
    return fallback;
  }
}
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

function escapeHtml(
  value: string
): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
const receiptSettings =
  readReceiptSettings();

const businessName =
  escapeHtml(
    receiptSettings.businessName
  );

const businessPhone =
  escapeHtml(
    receiptSettings.businessPhone
  );

const receiptFooter =
  escapeHtml(
    receiptSettings.receiptFooter
  );
export function printDayEndReport({
  
  transactions,
  balance,
}: PrintDayEndParams): void {
  const totalIncome = transactions
    .filter(
      (transaction) =>
        transaction.type === "income"
    )
    .reduce(
      (total, transaction) =>
        total + transaction.amount,
      0
    );

  const totalExpense = transactions
    .filter(
      (transaction) =>
        transaction.type === "expense"
    )
    .reduce(
      (total, transaction) =>
        total + transaction.amount,
      0
    );

  const netTotal =
    totalIncome - totalExpense;

  const transactionRows =
    transactions
      .map((transaction) => {
        const sign =
          transaction.type ===
          "income"
            ? "+"
            : "-";

        const time = new Date(
          transaction.createdAt
        ).toLocaleTimeString(
          "tr-TR",
          {
            hour: "2-digit",
            minute: "2-digit",
          }
        );

        return `
          <div class="transaction">
            <div class="transaction-top">
              <span>${time}</span>

              <strong>
                ${sign}${formatMoney(
                  transaction.amount
                )}
              </strong>
            </div>

            <div class="description">
              ${escapeHtml(
                transaction.description
              )}
            </div>
          </div>
        `;
      })
      .join("");

  const printWindow = window.open(
    "",
    "_blank",
    "width=480,height=760"
  );

  if (!printWindow) {
    window.alert(
      "Fiş önizlemesi açılamadı. Açılır pencere izni verin."
    );

    return;
  }

  printWindow.document.open();

  printWindow.document.write(`
    <!doctype html>
    <html lang="tr">
      <head>
        <meta charset="UTF-8" />

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />

        <title>REY KASA Gün Sonu</title>

        <style>
          @page {
            size: 80mm auto;
            margin: 3mm;
          }

          * {
            box-sizing: border-box;
          }

          html,
          body {
            width: 100%;
            margin: 0;
            padding: 0;
          }

          body {
            color: #000000;
            background: #ffffff;

            font-family:
              "Courier New",
              Courier,
              monospace;

            font-size: 11px;
            line-height: 1.35;
          }

          .preview-actions {
            position: sticky;
            top: 0;
            z-index: 10;

            width: calc(100% - 24px);
            max-width: 420px;

            margin:
  calc(
    12px + env(safe-area-inset-top)
  )
  auto
  12px;
            padding: 10px;

            scroll-margin-top:
  env(safe-area-inset-top);

            border: 1px solid #e5e7eb;
            border-radius: 16px;

            background: rgba(
              255,
              255,
              255,
              0.96
            );

            display: grid;
            grid-template-columns:
              1fr 1fr;
            gap: 8px;

            box-shadow:
              0 8px 24px
              rgba(15, 23, 42, 0.1);

            font-family:
              -apple-system,
              BlinkMacSystemFont,
              "Segoe UI",
              sans-serif;
          }

          .preview-actions button {
            min-height: 48px;

            border-radius: 13px;

            font-size: 14px;
            font-weight: 750;

            cursor: pointer;
          }

          .preview-close {
            border:
              1px solid #d1d5db;

            background: #f3f4f6;
            color: #374151;
          }

          .preview-print {
            border:
              1px solid #c79a2b;

            background: #c79a2b;
            color: #ffffff;
          }

          .receipt {
            width: 74mm;
            margin: 0 auto;
          }

          .center {
            text-align: center;
          }

          .title {
            margin: 0;

            font-size: 19px;
            font-weight: 900;
          }

          .subtitle {
            margin: 3px 0 0;

            font-size: 12px;
            font-weight: 700;
          }

          .date {
            margin-top: 5px;

            font-size: 10px;
          }

          .divider {
            margin: 9px 0;

            border-top:
              1px dashed #000000;
          }

          .transaction {
            padding: 5px 0;

            border-bottom:
              1px dotted #777777;

            page-break-inside:
              avoid;
          }

          .transaction-top {
            display: flex;
            align-items: center;
            justify-content:
              space-between;
            gap: 8px;
          }

          .transaction-top strong {
            font-size: 12px;
            white-space: nowrap;
          }

          .description {
            margin-top: 2px;

            overflow-wrap: anywhere;

            font-size: 10px;
          }

          .summary-row {
            display: flex;
            align-items: center;
            justify-content:
              space-between;
            gap: 10px;

            margin: 4px 0;
          }

          .summary-row strong {
            white-space: nowrap;
          }

          .total {
            margin-top: 7px;
            padding-top: 7px;

            border-top:
              2px solid #000000;

            font-size: 13px;
            font-weight: 900;
          }

          .footer {
            margin-top: 12px;

            text-align: center;
            font-size: 10px;
          }

          @media screen {
            body {
              width: 100%;

              padding-bottom: 30px;
            }

            .receipt {
              margin: 0 auto;
            }
          }

          @media print {
            .preview-actions {
              display: none !important;
            }

            html,
            body,
            .receipt {
              width: 74mm;
              margin: 0;
              padding: 0;
            }
          }
        </style>
      </head>

      <body>
        <div class="preview-actions">
          <button
            type="button"
            class="preview-close"
            onclick="window.close()"
          >
            Geri Dön
          </button>

          <button
            type="button"
            class="preview-print"
            onclick="window.print()"
          >
            Yazdır
          </button>
        </div>

        <main class="receipt">
          <header class="center">
            <h1 class="title">
  ${businessName}
</h1>

${
  businessPhone
    ? `
      <div class="date">
        ${businessPhone}
      </div>
    `
    : ""
}

            <p class="subtitle">
              GÜN SONU RAPORU
            </p>

            <div class="date">
              ${new Date().toLocaleString(
                "tr-TR"
              )}
            </div>
          </header>

          <div class="divider"></div>

          <section>
            ${
              transactionRows ||
              "<p class='center'>Bugün işlem yok.</p>"
            }
          </section>

          <div class="divider"></div>

          <section>
            <div class="summary-row">
              <span>
                Toplam Gelir
              </span>

              <strong>
                ${formatMoney(
                  totalIncome
                )}
              </strong>
            </div>

            <div class="summary-row">
              <span>
                Toplam Gider
              </span>

              <strong>
                ${formatMoney(
                  totalExpense
                )}
              </strong>
            </div>

            <div class="summary-row">
              <span>
                Net Değişim
              </span>

              <strong>
                ${formatMoney(
                  netTotal
                )}
              </strong>
            </div>

            <div class="summary-row total">
              <span>
                TOPLAM KASA
              </span>

              <strong>
                ${formatMoney(
                  balance
                )}
              </strong>
            </div>
          </section>

          <footer class="footer">
  <div>
    Toplam
    ${transactions.length}
    işlem
  </div>

  <div style="margin-top: 7px; font-weight: 700;">
    ${receiptFooter}
  </div>
</footer>
        </main>
      </body>
    </html>
  `);

  printWindow.document.close();
}