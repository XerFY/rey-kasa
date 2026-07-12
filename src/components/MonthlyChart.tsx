import "../styles/MonthlyChart.css";

import type { Transaction } from "../types/Transaction";

type Props = {
  transactions: Transaction[];
};

type DayTotal = {
  day: number;
  income: number;
  expense: number;
};

function MonthlyChart({
  transactions,
}: Props) {
  const now = new Date();

  const daysInMonth =
    new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0
    ).getDate();

  const totals: DayTotal[] =
    Array.from(
      {
        length: daysInMonth,
      },
      (_, index) => ({
        day: index + 1,
        income: 0,
        expense: 0,
      })
    );

  transactions.forEach(
    (transaction) => {
      const date =
        new Date(
          transaction.createdAt
        );

      if (
        date.getFullYear() !==
          now.getFullYear() ||
        date.getMonth() !==
          now.getMonth()
      ) {
        return;
      }

      const target =
        totals[
          date.getDate() - 1
        ];

      if (
        transaction.type ===
        "income"
      ) {
        target.income +=
          transaction.amount;
      } else {
        target.expense +=
          transaction.amount;
      }
    }
  );

  const visibleTotals =
    totals.filter(
      (total) =>
        total.income > 0 ||
        total.expense > 0
    );

  const maximum =
    Math.max(
      1,
      ...visibleTotals.flatMap(
        (total) => [
          total.income,
          total.expense,
        ]
      )
    );

  return (
    <section className="monthly-chart-card">
      <div className="monthly-chart-heading">
        <div>
          <h2>Aylık Hareket</h2>

          <p>
            Günlere göre gelir ve gider
            karşılaştırması
          </p>
        </div>

        <div className="monthly-chart-legend">
          <span>
            <i className="legend-income" />
            Gelir
          </span>

          <span>
            <i className="legend-expense" />
            Gider
          </span>
        </div>
      </div>

      {visibleTotals.length === 0 ? (
        <div className="monthly-chart-empty">
          Bu ay grafik oluşturacak işlem
          bulunmuyor.
        </div>
      ) : (
        <div className="monthly-chart-scroll">
          <div className="monthly-chart">
            {visibleTotals.map(
              (total) => (
                <div
                  className="monthly-chart-day"
                  key={total.day}
                >
                  <div className="monthly-chart-bars">
                    <span
                      className="monthly-bar monthly-income-bar"
                      style={{
                        height: `${
                          (total.income /
                            maximum) *
                          100
                        }%`,
                      }}
                      title={`Gelir: ${total.income}`}
                    />

                    <span
                      className="monthly-bar monthly-expense-bar"
                      style={{
                        height: `${
                          (total.expense /
                            maximum) *
                          100
                        }%`,
                      }}
                      title={`Gider: ${total.expense}`}
                    />
                  </div>

                  <small>
                    {total.day}
                  </small>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </section>
  );
}

export default MonthlyChart;