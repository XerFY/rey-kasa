import {
  Bell,
  Building2,
  Database,
  MessageSquareText,
  Palette,
  Plus,
  Printer,
  Save,
  SlidersHorizontal,
  Trash2,
  WalletCards,
} from "lucide-react";

import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import "../styles/SettingsPage.css";
import AuditHistory from "../components/AuditHistory";
import BackupManager from "../components/BackupManager";
import OpeningBalanceCard from "../components/OpeningBalanceCard";

import type {
  AppSettings,
  QuickDescription,
  QuickDescriptionType,
  ThemeMode,
} from "../types/AppSettings";

import {
  parseMoneyInput,
} from "../utils/moneyUtils";

type Props = {
  settings: AppSettings;
  loading: boolean;
  saving: boolean;

  onSaveQuickDescriptions: (
    descriptions: QuickDescription[]
  ) => Promise<void>;

  onSaveOpeningBalance: (
    amount: number
  ) => Promise<void>;

  onSaveGeneralSettings: (
    settings: AppSettings
  ) => Promise<void>;
};

type SettingsTab =
  | "cash"
  | "appearance"
  | "system";

const settingsTabs = [
  {
    id: "cash" as const,
    label: "Kasa",
    description:
      "Başlangıç tutarı ve hazır işlemler",
    icon: WalletCards,
  },
  {
    id: "appearance" as const,
    label: "Görünüm",
    description:
      "İşletme, tema ve uyarı tercihleri",
    icon: Palette,
  },
  {
    id: "system" as const,
    label: "Sistem",
    description:
      "Yazıcı, yedek ve kayıt geçmişi",
    icon: Database,
  },
];

const themeOptions: Array<{
  value: ThemeMode;
  label: string;
}> = [
  {
    value: "light",
    label: "Açık İnci",
  },
  {
    value: "dark",
    label: "Koyu Grafit",
  },
  {
    value: "emerald",
    label: "Zümrüt Altın",
  },
  {
    value: "midnight",
    label: "Safir Gece",
  },
  {
    value: "burgundy",
    label: "Bordo Altın",
  },
  {
    value: "system",
    label: "Otomatik",
  },
];

function SettingsPage({
  settings,
  loading,
  saving,
  onSaveQuickDescriptions,
  onSaveOpeningBalance,
  onSaveGeneralSettings,
}: Props) {
  const [activeTab, setActiveTab] =
    useState<SettingsTab>("cash");

  const [newDescription, setNewDescription] =
    useState("");

  const [
    newDescriptionAmount,
    setNewDescriptionAmount,
  ] = useState("");

  const [selectedType, setSelectedType] =
    useState<QuickDescriptionType>(
      "expense"
    );

  const [savedMessage, setSavedMessage] =
    useState("");

  const [
    saveMessageIsError,
    setSaveMessageIsError,
  ] = useState(false);

  const [draft, setDraft] =
    useState<AppSettings>(settings);

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  useEffect(() => {
    if (!savedMessage) return;

    const timeout = window.setTimeout(
      () => {
        setSavedMessage("");
      },
      2200
    );

    return () => {
      window.clearTimeout(timeout);
    };
  }, [savedMessage]);

  const incomeDescriptions =
    settings.quickDescriptions.filter(
      (description) =>
        description.type === "income"
    );

  const expenseDescriptions =
    settings.quickDescriptions.filter(
      (description) =>
        description.type === "expense"
    );

  const visibleDescriptions =
    selectedType === "income"
      ? incomeDescriptions
      : expenseDescriptions;

  const activeTabInformation =
    settingsTabs.find(
      (tab) => tab.id === activeTab
    ) ?? settingsTabs[0];

  const formDisabled = loading || saving;

  function showSaveSuccess(message: string) {
    setSaveMessageIsError(false);
    setSavedMessage(message);
  }

  function showSaveError(
    error: unknown,
    fallback: string
  ) {
    setSaveMessageIsError(true);
    setSavedMessage(
      error instanceof Error
        ? error.message
        : fallback
    );
  }

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

  async function updateTheme(
    theme: ThemeMode
  ): Promise<void> {
    const updatedSettings: AppSettings = {
      ...draft,
      theme,
    };

    setDraft(updatedSettings);

    try {
      await onSaveGeneralSettings(
        updatedSettings
      );

      const selectedTheme =
        themeOptions.find(
          (option) =>
            option.value === theme
        );

      showSaveSuccess(
        `${selectedTheme?.label ?? "Seçilen"} teması etkinleştirildi`
      );
    } catch (error) {
      setDraft(settings);
      showSaveError(
        error,
        "Tema kaydedilemedi."
      );
    }
  }

  async function handleAddDescription(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (formDisabled) return;

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
      showSaveError(
        new Error(
          "Bu açıklama zaten kayıtlı"
        ),
        "Bu açıklama zaten kayıtlı"
      );

      return;
    }

    const numericAmount = parseMoneyInput(
      newDescriptionAmount
    );

    const newItem: QuickDescription = {
      id: crypto.randomUUID(),
      type: selectedType,
      label: cleanLabel,

      ...(numericAmount !== null &&
      numericAmount > 0
        ? {
            amount: numericAmount,
          }
        : {}),
    };

    try {
      await onSaveQuickDescriptions([
        ...settings.quickDescriptions,
        newItem,
      ]);

      setNewDescription("");
      setNewDescriptionAmount("");

      showSaveSuccess(
        typeof newItem.amount === "number"
          ? "Tek dokunuşluk işlem eklendi"
          : "Hazır açıklama eklendi"
      );
    } catch (error) {
      showSaveError(
        error,
        "Hazır açıklama eklenemedi."
      );
    }
  }

  async function handleDeleteDescription(
    id: string
  ) {
    if (formDisabled) return;

    try {
      await onSaveQuickDescriptions(
        settings.quickDescriptions.filter(
          (description) =>
            description.id !== id
        )
      );

      showSaveSuccess(
        "Hazır açıklama silindi"
      );
    } catch (error) {
      showSaveError(
        error,
        "Hazır açıklama silinemedi."
      );
    }
  }

  async function handleGeneralSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (formDisabled) return;

    try {
      await onSaveGeneralSettings(draft);

      showSaveSuccess("Ayarlar kaydedildi");
    } catch (error) {
      showSaveError(
        error,
        "Ayarlar kaydedilemedi."
      );
    }
  }

  async function handleOpeningBalanceSave(
    amount: number
  ): Promise<void> {
    try {
      await onSaveOpeningBalance(amount);
    } catch (error) {
      showSaveError(
        error,
        "Başlangıç kasası kaydedilemedi."
      );

      throw error;
    }
  }

  function renderDescriptionGroup() {
    return (
      <div className="description-group">
        <div className="description-group-title">
          <span
            className={
              selectedType === "income"
                ? "group-income"
                : "group-expense"
            }
          >
            {selectedType === "income"
              ? "Gelir İşlemleri"
              : "Gider İşlemleri"}
          </span>

          <small>
            {visibleDescriptions.length} kayıt
          </small>
        </div>

        {visibleDescriptions.length === 0 ? (
          <div className="settings-empty">
            Bu grupta henüz açıklama yok.
          </div>
        ) : (
          <div className="description-list">
            {visibleDescriptions.map(
              (description) => (
                <div
                  className="description-item"
                  key={description.id}
                >
                  <div className="description-item-info">
                    <span>
                      {description.label}
                    </span>

                    {typeof description.amount ===
                      "number" &&
                      description.amount > 0 && (
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
                    disabled={formDisabled}
                    aria-label={`${description.label} açıklamasını sil`}
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
          Kasa, görünüm ve sistem
          tercihlerini tek yerden yönet.
        </p>
      </header>

      {savedMessage && (
        <div
          className={`settings-global-message ${
            saveMessageIsError
              ? "settings-global-error"
              : ""
          }`}
          role={
            saveMessageIsError
              ? "alert"
              : "status"
          }
        >
          {savedMessage}
        </div>
      )}

      <div className="settings-tab-navigation">
        <div
          className="settings-tabs"
          role="tablist"
          aria-label="Ayar kategorileri"
        >
          {settingsTabs.map((tab) => {
            const Icon = tab.icon;
            const selected =
              activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`settings-tab-${tab.id}`}
                aria-selected={selected}
                aria-controls={`settings-panel-${tab.id}`}
                className={
                  selected ? "active" : ""
                }
                onClick={() =>
                  setActiveTab(tab.id)
                }
              >
                <span className="settings-tab-icon">
                  <Icon size={18} />
                </span>

                <strong>{tab.label}</strong>
              </button>
            );
          })}
        </div>

        <p>{activeTabInformation.description}</p>
      </div>

      {activeTab === "cash" && (
        <div
          className="settings-tab-panel settings-panel-stack"
          id="settings-panel-cash"
          role="tabpanel"
          aria-labelledby="settings-tab-cash"
        >
          <OpeningBalanceCard
            openingBalance={
              settings.openingBalance
            }
            saving={formDisabled}
            onSave={handleOpeningBalanceSave}
          />

          <article className="settings-card">
            <div className="settings-card-title">
              <div className="settings-card-icon">
                <MessageSquareText
                  size={22}
                />
              </div>

              <div>
                <h2>Hazır İşlemler</h2>

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
                <span>Gelir</span>
                <small>
                  {incomeDescriptions.length}
                </small>
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
                <span>Gider</span>
                <small>
                  {expenseDescriptions.length}
                </small>
              </button>
            </div>

            <form
              className="description-form"
              onSubmit={handleAddDescription}
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
                disabled={formDisabled}
                aria-label="Hazır işlem açıklaması"
              />

              <div className="quick-amount-setting">
                <b>₺</b>

                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="Tutar (isteğe bağlı)"
                  value={newDescriptionAmount}
                  onChange={(event) =>
                    setNewDescriptionAmount(
                      event.target.value
                    )
                  }
                  disabled={formDisabled}
                  aria-label="Hazır işlem tutarı"
                />
              </div>

              <button
                type="submit"
                disabled={
                  formDisabled ||
                  !newDescription.trim()
                }
              >
                <Plus size={20} />
                Ekle
              </button>
            </form>

            {loading ? (
              <div className="settings-empty settings-loading">
                Ayarlar yükleniyor...
              </div>
            ) : (
              <div className="description-groups">
                {renderDescriptionGroup()}
              </div>
            )}
          </article>
        </div>
      )}

      {activeTab === "appearance" && (
        <form
          className="settings-tab-panel settings-panel-stack advanced-settings-form"
          id="settings-panel-appearance"
          role="tabpanel"
          aria-labelledby="settings-tab-appearance"
          onSubmit={handleGeneralSubmit}
        >
          <article className="settings-card">
            <div className="settings-card-title">
              <div className="settings-card-icon">
                <Building2 size={22} />
              </div>

              <div>
                <h2>İşletme Bilgileri</h2>

                <p>
                  Rapor ve fişlerde
                  gösterilecek bilgiler.
                </p>
              </div>
            </div>

            <div className="settings-fields">
              <label>
                <span>İşletme Adı</span>

                <input
                  type="text"
                  value={draft.businessName}
                  onChange={(event) =>
                    updateSetting(
                      "businessName",
                      event.target.value
                    )
                  }
                  maxLength={50}
                  disabled={formDisabled}
                />
              </label>

              <label>
                <span>Telefon</span>

                <input
                  type="tel"
                  value={draft.businessPhone}
                  onChange={(event) =>
                    updateSetting(
                      "businessPhone",
                      event.target.value
                    )
                  }
                  maxLength={25}
                  placeholder="İsteğe bağlı"
                  disabled={formDisabled}
                />
              </label>

              <label>
                <span>Fiş Alt Yazısı</span>

                <input
                  type="text"
                  value={draft.receiptFooter}
                  onChange={(event) =>
                    updateSetting(
                      "receiptFooter",
                      event.target.value
                    )
                  }
                  maxLength={70}
                  disabled={formDisabled}
                />
              </label>
            </div>
          </article>

          <article className="settings-card">
            <div className="settings-card-title">
              <div className="settings-card-icon">
                <Palette size={22} />
              </div>

              <div>
                <h2>Görünüm</h2>

                <p>
                  Uygulamanın temasını seç.
                </p>
              </div>
            </div>

            <div className="theme-selector">
              {themeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={
                    draft.theme === option.value
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    void updateTheme(
                      option.value
                    )
                  }
                  disabled={formDisabled}
                  aria-pressed={
                    draft.theme === option.value
                  }
                >
                  {option.label}
                </button>
              ))}
            </div>
          </article>

          <article className="settings-card">
            <div className="settings-card-title">
              <div className="settings-card-icon">
                <Bell size={22} />
              </div>

              <div>
                <h2>Uyarılar</h2>

                <p>
                  Gün sonu ve yüksek tutar
                  kontrolleri.
                </p>
              </div>
            </div>

            <div className="settings-option-block">
              <label className="settings-switch-row">
                <div>
                  <strong>
                    Gün Sonu Hatırlatıcısı
                  </strong>

                  <span>
                    Belirlenen saatte uyarı
                    gösterir.
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
                  disabled={formDisabled}
                />
              </label>

              {draft.dayEndReminderEnabled && (
                <label className="settings-inline-field">
                  <span>Hatırlatma Saati</span>

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
                    disabled={formDisabled}
                  />
                </label>
              )}
            </div>

            <div className="settings-option-block">
              <label className="settings-switch-row">
                <div>
                  <strong>
                    Büyük Tutar Uyarısı
                  </strong>

                  <span>
                    Yüksek tutarlı işlemlerde
                    onay ister.
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
                  disabled={formDisabled}
                />
              </label>

              {draft.largeTransactionWarningEnabled && (
                <label className="settings-inline-field">
                  <span>Uyarı Sınırı</span>

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
                      disabled={formDisabled}
                    />
                  </div>
                </label>
              )}
            </div>
          </article>

          <button
            type="submit"
            className="save-all-settings"
            disabled={formDisabled}
          >
            <Save size={20} />

            {saving
              ? "Kaydediliyor..."
              : "Görünüm Ayarlarını Kaydet"}
          </button>
        </form>
      )}

      {activeTab === "system" && (
        <div
          className="settings-tab-panel settings-panel-stack"
          id="settings-panel-system"
          role="tabpanel"
          aria-labelledby="settings-tab-system"
        >
          <form
            className="settings-panel-stack"
            onSubmit={handleGeneralSubmit}
          >
            <article className="settings-card">
              <div className="settings-card-title">
                <div className="settings-card-icon">
                  <Printer size={22} />
                </div>

                <div>
                  <h2>XP-Q80A Yazıcı</h2>

                  <p>
                    Ağ ve otomatik çıktı
                    ayarları.
                  </p>
                </div>
              </div>

              <label className="settings-switch-row">
                <div>
                  <strong>Ağ Yazıcısı</strong>

                  <span>
                    Yazıcı kuyruğunu
                    etkinleştirir.
                  </span>
                </div>

                <input
                  type="checkbox"
                  checked={draft.printer.enabled}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      printer: {
                        ...current.printer,
                        enabled:
                          event.target.checked,
                      },
                    }))
                  }
                  disabled={formDisabled}
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
                      setDraft((current) => ({
                        ...current,
                        printer: {
                          ...current.printer,
                          ipAddress:
                            event.target.value,
                        },
                      }))
                    }
                    placeholder="192.168.1.200"
                    disabled={
                      formDisabled ||
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
                    value={draft.printer.port}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        printer: {
                          ...current.printer,
                          port: Number(
                            event.target.value
                          ),
                        },
                      }))
                    }
                    disabled={
                      formDisabled ||
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
                    draft.printer.autoPrintDayEnd
                  }
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      printer: {
                        ...current.printer,
                        autoPrintDayEnd:
                          event.target.checked,
                      },
                    }))
                  }
                  disabled={
                    formDisabled ||
                    !draft.printer.enabled
                  }
                />
              </label>
            </article>

            <button
              type="submit"
              className="save-all-settings"
              disabled={formDisabled}
            >
              <Save size={20} />

              {saving
                ? "Kaydediliyor..."
                : "Yazıcı Ayarlarını Kaydet"}
            </button>
          </form>

          <div className="settings-system-divider">
            <SlidersHorizontal size={16} />
            <span>Veri yönetimi</span>
          </div>

          <BackupManager />
          <AuditHistory />
        </div>
      )}
    </section>
  );
}

export default SettingsPage;
