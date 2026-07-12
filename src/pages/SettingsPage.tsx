import {
  Check,
  MessageSquareText,
  Plus,
  Trash2,
} from "lucide-react";
import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import "../styles/SettingsPage.css";

import OpeningBalanceCard from "../components/OpeningBalanceCard";

import type {
  QuickDescription,
  QuickDescriptionType,
} from "../types/AppSettings";

type Props = {
  quickDescriptions: QuickDescription[];
  openingBalance: number;
  loading: boolean;
  saving: boolean;

  onSaveQuickDescriptions: (
    descriptions: QuickDescription[]
  ) => void | Promise<void>;

  onSaveOpeningBalance: (
    amount: number
  ) => void | Promise<void>;
};

function SettingsPage({
  quickDescriptions,
  openingBalance,
  loading,
  saving,
  onSaveQuickDescriptions,
  onSaveOpeningBalance,
}: Props) {
  const [newDescription, setNewDescription] =
    useState("");

  const [selectedType, setSelectedType] =
    useState<QuickDescriptionType>("expense");

  const [savedMessage, setSavedMessage] =
    useState(false);

  useEffect(() => {
    if (!savedMessage) return;

    const timeout = window.setTimeout(() => {
      setSavedMessage(false);
    }, 1800);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [savedMessage]);

  const incomeDescriptions =
    quickDescriptions.filter(
      (description) =>
        description.type === "income"
    );

  const expenseDescriptions =
    quickDescriptions.filter(
      (description) =>
        description.type === "expense"
    );

  async function handleAdd(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const cleanLabel = newDescription.trim();

    if (!cleanLabel) return;

    const alreadyExists =
      quickDescriptions.some(
        (description) =>
          description.type === selectedType &&
          description.label.toLocaleLowerCase(
            "tr-TR"
          ) ===
            cleanLabel.toLocaleLowerCase("tr-TR")
      );

    if (alreadyExists) {
      setNewDescription("");
      return;
    }

    const newItem: QuickDescription = {
      id: crypto.randomUUID(),
      type: selectedType,
      label: cleanLabel,
    };

    await onSaveQuickDescriptions([
      ...quickDescriptions,
      newItem,
    ]);

    setNewDescription("");
    setSavedMessage(true);
  }

  async function handleDelete(id: string) {
    await onSaveQuickDescriptions(
      quickDescriptions.filter(
        (description) => description.id !== id
      )
    );

    setSavedMessage(true);
  }

  function renderDescriptionGroup(
    title: string,
    descriptions: QuickDescription[],
    type: QuickDescriptionType
  ) {
    return (
      <div className="description-group">
        <div className="description-group-title">
          <span
            className={
              type === "income"
                ? "group-income"
                : "group-expense"
            }
          >
            {title}
          </span>

          <small>{descriptions.length} kayıt</small>
        </div>

        {descriptions.length === 0 ? (
          <div className="settings-empty">
            Bu grupta henüz açıklama yok.
          </div>
        ) : (
          <div className="description-list">
            {descriptions.map((description) => (
              <div
                className="description-item"
                key={description.id}
              >
                <span>{description.label}</span>

                <button
                  type="button"
                  onClick={() =>
                    void handleDelete(description.id)
                  }
                  disabled={saving}
                  aria-label={`${description.label} açıklamasını sil`}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <section className="settings-page">
      <header className="settings-header">
        <span>REY KASA</span>
        <h1>Ayarlar</h1>

        <p>
          Kasa ve günlük kullanım seçeneklerini
          buradan düzenleyebilirsin.
        </p>
      </header>

      <OpeningBalanceCard
        openingBalance={openingBalance}
        saving={saving}
        onSave={onSaveOpeningBalance}
      />

      <article className="settings-card">
        <div className="settings-card-title">
          <div className="settings-card-icon">
            <MessageSquareText size={22} />
          </div>

          <div>
            <h2>Hazır Açıklamalar</h2>

            <p>
              Açıklamanın gelir veya gider ekranında
              gösterileceğini seç.
            </p>
          </div>
        </div>

        <div className="settings-type-selector">
          <button
            type="button"
            className={
              selectedType === "income"
                ? "settings-income-selected"
                : ""
            }
            onClick={() => setSelectedType("income")}
          >
            Gelir
          </button>

          <button
            type="button"
            className={
              selectedType === "expense"
                ? "settings-expense-selected"
                : ""
            }
            onClick={() => setSelectedType("expense")}
          >
            Gider
          </button>
        </div>

        <form
          className="description-form"
          onSubmit={handleAdd}
        >
          <input
            type="text"
            placeholder={
              selectedType === "income"
                ? "Örneğin: Nakit Tahsilat"
                : "Örneğin: Market Ödemesi"
            }
            value={newDescription}
            onChange={(event) =>
              setNewDescription(event.target.value)
            }
            maxLength={40}
            disabled={saving}
          />

          <button
            type="submit"
            disabled={saving || !newDescription.trim()}
          >
            <Plus size={20} />
            Ekle
          </button>
        </form>

        {savedMessage && (
          <div className="settings-saved">
            <Check size={17} />
            Değişiklik kaydedildi
          </div>
        )}

        {loading ? (
          <div className="settings-empty settings-loading">
            Ayarlar yükleniyor...
          </div>
        ) : (
          <div className="description-groups">
            {renderDescriptionGroup(
              "Gelir Açıklamaları",
              incomeDescriptions,
              "income"
            )}

            {renderDescriptionGroup(
              "Gider Açıklamaları",
              expenseDescriptions,
              "expense"
            )}
          </div>
        )}

        <footer className="settings-card-footer">
          Toplam {quickDescriptions.length} hazır açıklama
        </footer>
      </article>
    </section>
  );
}

export default SettingsPage;