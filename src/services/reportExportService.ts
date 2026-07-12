import type { Transaction } from "../types/Transaction";

type ExportReportParams = {
  transactions: Transaction[];
  title: string;
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

function escapeCsv(
  value: string
): string {
  const escaped =
    value.replaceAll('"', '""');

  return `"${escaped}"`;
}

function createFileDate(): string {
  const now = new Date();

  const year = now.getFullYear();

  const month = String(
    now.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    now.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export async function exportReportCsv({
  transactions,
  title,
}: ExportReportParams): Promise<void> {
  const header = [
    "Tarih",
    "Saat",
    "İşlem Türü",
    "Açıklama",
    "Tutar",
  ].join(";");

  const rows = transactions.map(
    (transaction) => {
      const date = new Date(
        transaction.createdAt
      );

      return [
        escapeCsv(
          date.toLocaleDateString(
            "tr-TR"
          )
        ),

        escapeCsv(
          date.toLocaleTimeString(
            "tr-TR",
            {
              hour: "2-digit",
              minute: "2-digit",
            }
          )
        ),

        escapeCsv(
          transaction.type ===
            "income"
            ? "Gelir"
            : "Gider"
        ),

        escapeCsv(
          transaction.description
        ),

        escapeCsv(
          (
            transaction.type ===
            "income"
              ? transaction.amount
              : -transaction.amount
          )
            .toFixed(2)
            .replace(".", ",")
        ),
      ].join(";");
    }
  );

  const csvContent = [
    header,
    ...rows,
  ].join("\n");

  const fileName =
    `rey-kasa-${title
      .toLocaleLowerCase("tr-TR")
      .replaceAll(" ", "-")}-${createFileDate()}.csv`;

  const file = new File(
    ["\uFEFF", csvContent],
    fileName,
    {
      type: "text/csv;charset=utf-8",
    }
  );

  if (
    navigator.share &&
    navigator.canShare?.({
      files: [file],
    })
  ) {
    await navigator.share({
      title: `REY KASA - ${title}`,
      files: [file],
    });

    return;
  }

  const url =
    URL.createObjectURL(file);

  const link =
    document.createElement("a");

  link.href = url;
  link.download = fileName;

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

export function openReportForPdf({
  transactions,
  title,
}: ExportReportParams): void {
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

  const rows = transactions
    .map((transaction) => {
      const date = new Date(
        transaction.createdAt
      );

      return `
        <tr>
          <td>
            ${date.toLocaleDateString("tr-TR")}
            <small>
              ${date.toLocaleTimeString("tr-TR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </small>
          </td>

          <td>
            ${escapeHtml(transaction.description)}
          </td>

          <td>
            ${
              transaction.type === "income"
                ? "Gelir"
                : "Gider"
            }
          </td>

          <td class="${
            transaction.type === "income"
              ? "income"
              : "expense"
          }">
            ${
              transaction.type === "income"
                ? "+"
                : "-"
            }₺${formatMoney(transaction.amount)}
          </td>
        </tr>
      `;
    })
    .join("");

  const reportWindow = window.open(
    "",
    "_blank",
    "width=900,height=760"
  );

  if (!reportWindow) {
    window.alert(
      "Rapor penceresi açılamadı. Açılır pencere izni verin."
    );

    return;
  }

  reportWindow.document.open();

  reportWindow.document.write(`
    <!doctype html>
    <html lang="tr">
      <head>
        <meta charset="UTF-8" />

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />

        <title>REY KASA - ${escapeHtml(title)}</title>

        <style>
          @page {
            size: A4;
            margin: 14mm;
          }

          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            padding: 0;

            background: #f5f7fa;
            color: #1e293b;

            font-family:
              -apple-system,
              BlinkMacSystemFont,
              "Segoe UI",
              Arial,
              sans-serif;
          }

          .actions {
            position: sticky;
            top: 0;
            z-index: 10;

            max-width: 900px;

            margin:
              calc(
                12px +
                env(safe-area-inset-top)
              )
              auto
              12px;

            padding: 10px;

            border: 1px solid #dbe2ea;
            border-radius: 16px;

            background: #ffffff;

            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 9px;

            box-shadow:
              0 10px 30px
              rgba(15, 23, 42, 0.1);
          }

          .actions button {
            min-height: 48px;

            border-radius: 13px;

            font-size: 14px;
            font-weight: 750;
          }

          .back {
            border: 1px solid #dbe2ea;

            background: #f7f9fc;
            color: #475569;
          }

          .print {
            border: 1px solid #c79a2b;

            background: #c79a2b;
            color: #ffffff;
          }

          .report {
            max-width: 900px;

            margin: 0 auto 30px;
            padding: 32px;

            background: #ffffff;
          }

          header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 20px;

            padding-bottom: 20px;

            border-bottom: 2px solid #c79a2b;
          }

          h1 {
            margin: 0;

            color: #c79a2b;

            font-size: 26px;
          }

          h2 {
            margin: 5px 0 0;

            font-size: 17px;
          }

          header p {
            margin: 0;

            color: #64748b;

            font-size: 12px;
          }

          .summary {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;

            margin: 22px 0;
          }

          .summary div {
            padding: 14px;

            border: 1px solid #dbe2ea;
            border-radius: 13px;

            background: #f7f9fc;
          }

          .summary span {
            display: block;

            margin-bottom: 5px;

            color: #64748b;

            font-size: 11px;
          }

          .summary strong {
            font-size: 15px;
          }

          .income {
            color: #16a34a;
          }

          .expense {
            color: #dc2626;
          }

          table {
            width: 100%;

            border-collapse: collapse;

            font-size: 12px;
          }

          th,
          td {
            padding: 10px 8px;

            border-bottom: 1px solid #e2e8f0;

            text-align: left;
          }

          th {
            color: #64748b;

            font-size: 10px;
            text-transform: uppercase;
          }

          td:last-child,
          th:last-child {
            text-align: right;
          }

          td small {
            display: block;

            margin-top: 3px;

            color: #94a3b8;
          }

          @media print {
            body {
              background: #ffffff;
            }

            .actions {
              display: none !important;
            }

            .report {
              max-width: none;
              margin: 0;
              padding: 0;
            }

            tr {
              page-break-inside: avoid;
            }
          }

          @media (max-width: 600px) {
            .report {
              padding: 18px 12px;
            }

            .summary {
              grid-template-columns: 1fr;
            }

            th:nth-child(3),
            td:nth-child(3) {
              display: none;
            }
          }
        </style>
      </head>

      <body>
        <div class="actions">
          <button
            class="back"
            onclick="window.close()"
          >
            Geri Dön
          </button>

          <button
            class="print"
            onclick="window.print()"
          >
            PDF / Yazdır
          </button>
        </div>

        <main class="report">
          <header>
            <div>
              <h1>REY KASA</h1>
              <h2>${escapeHtml(title)} Raporu</h2>
            </div>

            <p>
              ${new Date().toLocaleString("tr-TR")}
            </p>
          </header>

          <section class="summary">
            <div>
              <span>Toplam Gelir</span>

              <strong class="income">
                ₺${formatMoney(totalIncome)}
              </strong>
            </div>

            <div>
              <span>Toplam Gider</span>

              <strong class="expense">
                ₺${formatMoney(totalExpense)}
              </strong>
            </div>

            <div>
              <span>Net Değişim</span>

              <strong>
                ₺${formatMoney(
                  totalIncome - totalExpense
                )}
              </strong>
            </div>
          </section>

          <table>
            <thead>
              <tr>
                <th>Tarih</th>
                <th>Açıklama</th>
                <th>Tür</th>
                <th>Tutar</th>
              </tr>
            </thead>

            <tbody>
              ${
                rows ||
                `
                  <tr>
                    <td colspan="4">
                      İşlem bulunmuyor.
                    </td>
                  </tr>
                `
              }
            </tbody>
          </table>
        </main>
      </body>
    </html>
  `);

  reportWindow.document.close();
}