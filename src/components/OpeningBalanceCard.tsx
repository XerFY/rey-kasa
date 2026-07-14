import {
  Check,
  Landmark,
} from "lucide-react";
import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import "../styles/OpeningBalanceCard.css";

import {
  parseMoneyInput,
} from "../utils/moneyUtils";

type Props = {
  openingBalance: number;
  saving: boolean;
  onSave: (
    amount: number
  ) => Promise<void>;
};

function formatInputValue(
  amount: number
): string {
  if (amount === 0) {
    return "";
  }

  return String(amount);
}

function OpeningBalanceCard({
  openingBalance,
  saving,
  onSave,
}: Props) {
  const [amount, setAmount] =
    useState(
      formatInputValue(
        openingBalance
      )
    );

  const [saved, setSaved] =
    useState(false);

  useEffect(() => {
    setAmount(
      formatInputValue(
        openingBalance
      )
    );
  }, [openingBalance]);

  useEffect(() => {
    if (!saved) {
      return;
    }

    const timeout =
      window.setTimeout(() => {
        setSaved(false);
      }, 1800);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [saved]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const numericAmount =
      parseMoneyInput(amount);

    if (numericAmount === null) {
      return;
    }

    try {
      await onSave(numericAmount);
      setSaved(true);
    } catch {
      setSaved(false);
    }
  }

  return (
    <article className="opening-balance-card">
      <div className="opening-balance-heading">
        <div className="opening-balance-icon">
          <Landmark size={22} />
        </div>

        <div>
          <h2>
            Başlangıç Kasası
          </h2>

          <p>
            Uygulama kullanılmaya
            başlandığında kasada bulunan
            tutar.
          </p>
        </div>
      </div>

      <form
        className="opening-balance-form"
        onSubmit={handleSubmit}
      >
        <div className="opening-balance-input">
          <span>₺</span>

          <input
            type="text"
            inputMode="decimal"
            placeholder="0,00"
            value={amount}
            onChange={(event) =>
              setAmount(
                event.target.value
              )
            }
            disabled={saving}
          />
        </div>

        <button
          type="submit"
          disabled={saving}
        >
          {saving
            ? "Kaydediliyor..."
            : "Kaydet"}
        </button>
      </form>

      {saved && (
        <div className="opening-balance-saved">
          <Check size={17} />
          Başlangıç kasası kaydedildi
        </div>
      )}

      <div className="opening-balance-warning">
        Bu alanı yalnızca uygulamayı
        ilk kullanmaya başladığında veya
        gerçek başlangıç tutarı yanlışsa
        değiştir.
      </div>
    </article>
  );
}

export default OpeningBalanceCard;
