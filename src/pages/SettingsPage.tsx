import {
  Bell,
  Building2,
  MessageSquareText,
  Moon,
  Plus,
  Printer,
  Save,
  Sun,
  Trash2,
  TriangleAlert,
} from "lucide-react";

import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import "../styles/SettingsPage.css";

import AuditHistory from "../components/AuditHistory";
import OpeningBalanceCard from "../components/OpeningBalanceCard";

import type {
  AppSettings,
  QuickDescription,
  QuickDescriptionType,
  ThemeMode,
} from "../types/AppSettings";

type Props = {
  settings: AppSettings;
  loading: boolean;
  saving: boolean;

  onSaveQuickDescriptions: (
    descriptions: QuickDescription[]
  ) => void | Promise<void>;

  onSaveOpeningBalance: (
    amount: number
  ) => void | Promise<void>;

  onSaveGeneralSettings: (
    settings: AppSettings
  ) => void | Promise<void>;
};

function SettingsPage({
  settings,
  loading,
  saving,
  onSaveQuickDescriptions,
  onSaveOpeningBalance,
  onSaveGeneralSettings,
}: Props) {
  const [
    newDescription,
    setNewDescription,
  ] = useState("");

  const [
    newDescriptionAmount,
    setNewDescriptionAmount,
  ] = useState("");

  const [
    selectedType,
    setSelectedType,
  ] = useState<QuickDescriptionType>(
    "expense"
  );

  const [
    savedMessage,
    setSavedMessage,
  ] = useState("");

  const [
    draft,
    setDraft,
  ] = useState<AppSettings>(
    settings
  );

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  useEffect(() => {
    if (!savedMessage) return;

    const timeout =
      window.setTimeout(() => {
        setSavedMessage("");
      }, 2200);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [savedMessage]);

  const incomeDescriptions =
    settings.quickDescriptions.filter(
      (description) =>
        description.type ===
        "income"
    );

  const expenseDescriptions =
    settings.quickDescriptions.filter(
      (description) =>
        description.type ===
        "expense"
    );

  function updateSetting<
    Key extends keyof AppSettings,
  >(
    key: Key,
    value: AppSettings[Key]
  ) {
    setDraft((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function updateTheme(
    theme: ThemeMode
  ) {
    updateSetting(
      "theme",
      theme
    );
  }

  async function handleAddDescription(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const cleanLabel =
      newDescription.trim();

    if (!cleanLabel) return;

    const alreadyExists =
      settings.quickDescriptions.some(
        (description) =>
          description.type ===
            selectedType &&
          description.label.toLocaleLowerCase(
            "tr-TR"
          ) ===
            cleanLabel.toLocaleLowerCase(
              "tr-TR"
            )
      );

    if (alreadyExists) {
      setSavedMessage(
        "Bu açıklama zaten kayıtlı"
      );

      return;
    }

    const normalizedAmount =
      newDescriptionAmount
        .replace(/\./g, "")
        .replace(",", ".");

    const numericAmount =
      Number(normalizedAmount);

    const newItem: QuickDescription = {
      id: crypto.randomUUID(),
      type: selectedType,
      label: cleanLabel,

      ...(
        Number.isFinite(
          numericAmount
        ) &&
        numericAmount > 0
          ? {
              amount:
                numericAmount,
            }
          : {}
      ),
    };

    await onSaveQuickDescriptions([
      ...settings.quickDescriptions,
      newItem,
    ]);

    setNewDescription("");
    setNewDescriptionAmount("");

    setSavedMessage(
      typeof newItem.amount ===
        "number"
        ? "Tek dokunuşluk işlem eklendi"
        : "Hazır açıklama eklendi"
    );
  }

  async function handleDeleteDescription(
    id: string
  ) {
    await onSaveQuickDescriptions(
      settings.quickDescriptions.filter(
        (description) =>
          description.id !== id
      )
    );

    setSavedMessage(
      "Hazır açıklama silindi"
    );
  }

  async function handleGeneralSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    await onSaveGeneralSettings(
      draft
    );

    setSavedMessage(
      "Ayarlar kaydedildi"
    );
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

          <small>
            {descriptions.length} kayıt
          </small>
        </div>

        {descriptions.length === 0 ? (
          <div className="settings-empty">
            Bu grupta henüz açıklama yok.
          </div>
        ) : (
          <div className="description-list">
            {descriptions.map(
              (description) => (
                <div
                  className="description-item"
                  key={description.id}
                >
                  <div className="description-item-info">
                    <span>
                      {
                        description.label
                      }
                    </span>

                    {typeof description.amount ===
                      "number" &&
                      description.amount >
                        0 && (
                      <small>
                        Tek dokunuş: ₺
                        {description.amount.toLocaleString(
                          "tr-TR",
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }
                        )}
                      </small>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      void handleDeleteDescription(
                        description.id
                      )
                    }
                    disabled={saving}
                    aria-label="Açıklamayı sil"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              )
            )}
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
          Uygulama, işletme ve yazıcı
          seçeneklerini düzenle.
        </p>
      </header>

      {savedMessage && (
        <div className="settings-global-message">
          {savedMessage}
        </div>
      )}

      <OpeningBalanceCard
        openingBalance={
          settings.openingBalance
        }
        saving={saving}
        onSave={
          onSaveOpeningBalance
        }
      />

      <form
        className="advanced-settings-form"
        onSubmit={
          handleGeneralSubmit
        }
      >
        <article className="settings-card">
          <div className="settings-card-title">
            <div className="settings-card-icon">
              <Building2 size={22} />
            </div>

            <div>
              <h2>
                İşletme Bilgileri
              </h2>

              <p>
                Gün sonu raporu ve
                fişte gösterilecek bilgiler.
              </p>
            </div>
          </div>

          <div className="settings-fields">
            <label>
              <span>İşletme Adı</span>

              <input
                type="text"
                value={
                  draft.businessName
                }
                onChange={(event) =>
                  updateSetting(
                    "businessName",
                    event.target.value
                  )
                }
                maxLength={50}
                disabled={saving}
              />
            </label>

            <label>
              <span>Telefon</span>

              <input
                type="tel"
                value={
                  draft.businessPhone
                }
                onChange={(event) =>
                  updateSetting(
                    "businessPhone",
                    event.target.value
                  )
                }
                maxLength={25}
                placeholder="İsteğe bağlı"
                disabled={saving}
              />
            </label>

            <label>
              <span>
                Fiş Alt Yazısı
              </span>

              <input
                type="text"
                value={
                  draft.receiptFooter
                }
                onChange={(event) =>
                  updateSetting(
                    "receiptFooter",
                    event.target.value
                  )
                }
                maxLength={70}
                disabled={saving}
              />
            </label>
          </div>
        </article>

        <article className="settings-card">
          <div className="settings-card-title">
            <div className="settings-card-icon">
              <Sun size={22} />
            </div>

            <div>
              <h2>Görünüm</h2>

              <p>
                Uygulamanın temasını seç.
              </p>
            </div>
          </div>

          <div className="theme-selector">
            <button
              type="button"
              className={
                draft.theme === "light"
                  ? "active"
                  : ""
              }
              onClick={() =>
                updateTheme("light")
              }
            >
              <Sun size={18} />
              Açık
            </button>

            <button
              type="button"
              className={
                draft.theme === "dark"
                  ? "active"
                  : ""
              }
              onClick={() =>
                updateTheme("dark")
              }
            >
              <Moon size={18} />
              Koyu
            </button>

            <button
              type="button"
              className={
                draft.theme === "system"
                  ? "active"
                  : ""
              }
              onClick={() =>
                updateTheme("system")
              }
            >
              Otomatik
            </button>
          </div>
        </article>

        <article className="settings-card">
          <div className="settings-card-title">
            <div className="settings-card-icon">
              <Bell size={22} />
            </div>

            <div>
              <h2>
                Gün Sonu Hatırlatıcısı
              </h2>

              <p>
                Belirlenen saatte uyarı
                gösterir.
              </p>
            </div>
          </div>

          <label className="settings-switch-row">
            <div>
              <strong>
                Hatırlatıcı
              </strong>

              <span>
                Gün sonunu unutmanı
                önler.
              </span>
            </div>

            <input
              type="checkbox"
              checked={
                draft.dayEndReminderEnabled
              }
              onChange={(event) =>
                updateSetting(
                  "dayEndReminderEnabled",
                  event.target.checked
                )
              }
            />
          </label>

          {draft.dayEndReminderEnabled && (
            <label className="settings-inline-field">
              <span>
                Hatırlatma Saati
              </span>

              <input
                type="time"
                value={
                  draft.dayEndReminderTime
                }
                onChange={(event) =>
                  updateSetting(
                    "dayEndReminderTime",
                    event.target.value
                  )
                }
              />
            </label>
          )}
        </article>

        <article className="settings-card">
          <div className="settings-card-title">
            <div className="settings-card-icon">
              <TriangleAlert
                size={22}
              />
            </div>

            <div>
              <h2>
                Büyük Tutar Uyarısı
              </h2>

              <p>
                Yüksek tutarlı işlemlerde
                onay ister.
              </p>
            </div>
          </div>

          <label className="settings-switch-row">
            <div>
              <strong>
                Uyarıyı Etkinleştir
              </strong>

              <span>
                Yanlış tutar girişlerini
                azaltır.
              </span>
            </div>

            <input
              type="checkbox"
              checked={
                draft.largeTransactionWarningEnabled
              }
              onChange={(event) =>
                updateSetting(
                  "largeTransactionWarningEnabled",
                  event.target.checked
                )
              }
            />
          </label>

          {draft.largeTransactionWarningEnabled && (
            <label className="settings-inline-field">
              <span>
                Uyarı Sınırı
              </span>

              <div className="settings-money-input">
                <b>₺</b>

                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="100"
                  value={
                    draft.largeTransactionThreshold
                  }
                  onChange={(event) =>
                    updateSetting(
                      "largeTransactionThreshold",
                      Number(
                        event.target.value
                      )
                    )
                  }
                />
              </div>
            </label>
          )}
        </article>

        <article className="settings-card">
          <div className="settings-card-title">
            <div className="settings-card-icon">
              <Printer size={22} />
            </div>

            <div>
              <h2>XP-Q80A Yazıcı</h2>

              <p>
                Yazıcı ağ ve otomatik
                çıktı ayarları.
              </p>
            </div>
          </div>

          <label className="settings-switch-row">
            <div>
              <strong>
                Ağ Yazıcısı
              </strong>

              <span>
                Yazıcı kuyruğunu
                etkinleştirir.
              </span>
            </div>

            <input
              type="checkbox"
              checked={
                draft.printer.enabled
              }
              onChange={(event) =>
                setDraft(
                  (current) => ({
                    ...current,

                    printer: {
                      ...current.printer,

                      enabled:
                        event.target
                          .checked,
                    },
                  })
                )
              }
            />
          </label>

          <div className="printer-fields">
            <label>
              <span>IP Adresi</span>

              <input
                type="text"
                value={
                  draft.printer.ipAddress
                }
                onChange={(event) =>
                  setDraft(
                    (current) => ({
                      ...current,

                      printer: {
                        ...current.printer,

                        ipAddress:
                          event.target
                            .value,
                      },
                    })
                  )
                }
                placeholder="192.168.1.200"
                disabled={
                  !draft.printer.enabled
                }
              />
            </label>

            <label>
              <span>Port</span>

              <input
                type="number"
                min="1"
                max="65535"
                value={
                  draft.printer.port
                }
                onChange={(event) =>
                  setDraft(
                    (current) => ({
                      ...current,

                      printer: {
                        ...current.printer,

                        port: Number(
                          event.target.value
                        ),
                      },
                    })
                  )
                }
                disabled={
                  !draft.printer.enabled
                }
              />
            </label>
          </div>

          <label className="settings-switch-row">
            <div>
              <strong>
                Otomatik Yazdır
              </strong>

              <span>
                Gün sonunda yazdırma
                kuyruğuna ekler.
              </span>
            </div>

            <input
              type="checkbox"
              checked={
                draft.printer
                  .autoPrintDayEnd
              }
              onChange={(event) =>
                setDraft(
                  (current) => ({
                    ...current,

                    printer: {
                      ...current.printer,

                      autoPrintDayEnd:
                        event.target
                          .checked,
                    },
                  })
                )
              }
              disabled={
                !draft.printer.enabled
              }
            />
          </label>
        </article>

        <button
          type="submit"
          className="save-all-settings"
          disabled={saving}
        >
          <Save size={20} />

          {saving
            ? "Kaydediliyor..."
            : "Ayarları Kaydet"}
        </button>
      </form>

      <article className="settings-card">
        <div className="settings-card-title">
          <div className="settings-card-icon">
            <MessageSquareText
              size={22}
            />
          </div>

          <div>
            <h2>
              Hazır İşlemler
            </h2>

            <p>
              Tutar girilirse tek
              dokunuşla kaydedilir.
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
            onClick={() =>
              setSelectedType("income")
            }
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
            onClick={() =>
              setSelectedType("expense")
            }
          >
            Gider
          </button>
        </div>

        <form
          className="description-form"
          onSubmit={
            handleAddDescription
          }
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
              setNewDescription(
                event.target.value
              )
            }
            maxLength={40}
            disabled={saving}
          />

          <div className="quick-amount-setting">
            <b>₺</b>

            <input
              type="text"
              inputMode="decimal"
              placeholder="Tutar (isteğe bağlı)"
              value={
                newDescriptionAmount
              }
              onChange={(event) =>
                setNewDescriptionAmount(
                  event.target.value
                )
              }
              disabled={saving}
            />
          </div>

          <button
            type="submit"
            disabled={
              saving ||
              !newDescription.trim()
            }
          >
            <Plus size={20} />
            Ekle
          </button>
        </form>

        {loading ? (
          <div className="settings-empty">
            Ayarlar yükleniyor...
          </div>
        ) : (
          <div className="description-groups">
            {renderDescriptionGroup(
              "Gelir İşlemleri",
              incomeDescriptions,
              "income"
            )}

            {renderDescriptionGroup(
              "Gider İşlemleri",
              expenseDescriptions,
              "expense"
            )}
          </div>
        )}
      </article>

      <AuditHistory />
    </section>
  );
}

export default SettingsPage;