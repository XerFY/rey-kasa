import type { Transaction } from "../types/Transaction";

type PrintDayEndParams = {
  transactions: Transaction[];
  balance: number;
};

function formatMoney(amount: number): string {
  return amount.toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function printDayEndReport({
  transactions,
  balance,
}: PrintDayEndParams): void {
  const totalIncome = transactions
    .filter((item) => item.type === "income")
    .reduce((total, item) => total + item.amount, 0);

  const totalExpense = transactions
    .filter((item) => item.type === "expense")
    .reduce((total, item) => total + item.amount, 0);

  const transactionRows = transactions
    .map((transaction) => {
      const sign =
        transaction.type === "income" ? "+" : "-";

      const time = new Date(
        transaction.createdAt
      ).toLocaleTimeString("tr-TR", {
        hour: "2-digit",
        minute: "2-digit",
      });

      return `
        <div class="transaction">
          <div class="transaction-top">
            <span>${time}</span>
            <strong>
              ${sign}${formatMoney(transaction.amount)}
            </strong>
          </div>

          <div class="description">
            ${escapeHtml(transaction.description)}
          </div>
        </div>
      `;
    })
    .join("");

  const printWindow = window.open(
    "",
    "_blank",
    "width=420,height=700"
  );

  if (!printWindow) {
    window.alert(
      "Yazdırma penceresi açılamadı. Açılır pencere izni verin."
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
          content="width=device-width, initial-scale=1"
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
            width: 74mm;
            margin: 0;
            padding: 0;
          }

          body {
            color: #000;
            background: #fff;
            font-family:
              "Courier New",
              Courier,
              monospace;
            font-size: 11px;
            line-height: 1.35;
          }

          .receipt {
            width: 100%;
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
            border-top: 1px dashed #000;
          }

          .transaction {
            padding: 5px 0;
            border-bottom: 1px dotted #777;
            page-break-inside: avoid;
          }

          .transaction-top {
            display: flex;
            align-items: center;
            justify-content: space-between;
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
            justify-content: space-between;
            gap: 10px;
            margin: 4px 0;
          }

          .summary-row strong {
            white-space: nowrap;
          }

          .total {
            margin-top: 7px;
            padding-top: 7px;
            border-top: 2px solid #000;
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
              margin: 20px auto;
            }
          }

          @media print {
            html,
            body {
              width: 74mm;
            }
          }
        </style>
      </head>

      <body>
        <main class="receipt">
          <header class="center">
            <h1 class="title">REY KASA</h1>
            <p class="subtitle">GÜN SONU RAPORU</p>

            <div class="date">
              ${new Date().toLocaleString("tr-TR")}
            </div>
          </header>

          <div class="divider"></div>

          <section>
            ${transactionRows || "<p>Bugün işlem yok.</p>"}
          </section>

          <div class="divider"></div>

          <section>
            <div class="summary-row">
              <span>Toplam Gelir</span>
              <strong>${formatMoney(totalIncome)}</strong>
            </div>

            <div class="summary-row">
              <span>Toplam Gider</span>
              <strong>${formatMoney(totalExpense)}</strong>
            </div>

            <div class="summary-row">
              <span>Net Değişim</span>
              <strong>
                ${formatMoney(totalIncome - totalExpense)}
              </strong>
            </div>

            <div class="summary-row total">
              <span>TOPLAM KASA</span>
              <strong>${formatMoney(balance)}</strong>
            </div>
          </section>

          <footer class="footer">
            Toplam ${transactions.length} işlem
          </footer>
        </main>
      </body>
    </html>
  `);

  printWindow.document.close();

  printWindow.addEventListener("load", () => {
    window.setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 150);
  });
}