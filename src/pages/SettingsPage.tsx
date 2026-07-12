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

type Props = {
  quickDescriptions: string[];
  loading: boolean;
  saving: boolean;
  onSaveQuickDescriptions: (
    descriptions: string[]
  ) => void | Promise<void>;
};

function SettingsPage({
  quickDescriptions,
  loading,
  saving,
  onSaveQuickDescriptions,
}: Props) {
  const [newDescription, setNewDescription] =
    useState("");

  const [savedMessage, setSavedMessage] =
    useState(false);

  useEffect(() => {
    if (!savedMessage) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setSavedMessage(false);
    }, 1800);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [savedMessage]);

  async function handleAdd(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const cleanDescription =
      newDescription.trim();

    if (!cleanDescription) {
      return;
    }

    const alreadyExists =
      quickDescriptions.some(
        (description) =>
          description.toLocaleLowerCase("tr-TR") ===
          cleanDescription.toLocaleLowerCase("tr-TR")
      );

    if (alreadyExists) {
      setNewDescription("");
      return;
    }

    await onSaveQuickDescriptions([
      ...quickDescriptions,
      cleanDescription,
    ]);

    setNewDescription("");
    setSavedMessage(true);
  }

  async function handleDelete(
    descriptionToDelete: string
  ) {
    const updatedDescriptions =
      quickDescriptions.filter(
        (description) =>
          description !== descriptionToDelete
      );

    await onSaveQuickDescriptions(
      updatedDescriptions
    );

    setSavedMessage(true);
  }

  return (
    <section className="settings-page">
      <header className="settings-header">
        <span>REY KASA</span>
        <h1>Ayarlar</h1>

        <p>
          Günlük kullanım seçeneklerini buradan
          düzenleyebilirsin.
        </p>
      </header>

      <article className="settings-card">
        <div className="settings-card-title">
          <div className="settings-card-icon">
            <MessageSquareText size={22} />
          </div>

          <div>
            <h2>Hazır Açıklamalar</h2>

            <p>
              Gelir ve gider eklerken tek dokunuşla
              kullanabileceğin açıklamalar.
            </p>
          </div>
        </div>

        <form
          className="description-form"
          onSubmit={handleAdd}
        >
          <input
            type="text"
            placeholder="Örneğin: Nakit"
            value={newDescription}
            onChange={(event) =>
              setNewDescription(
                event.target.value
              )
            }
            maxLength={40}
            disabled={saving}
          />

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

        {savedMessage && (
          <div className="settings-saved">
            <Check size={17} />
            Değişiklik kaydedildi
          </div>
        )}

        <div className="description-list">
          {loading ? (
            <div className="settings-empty">
              Ayarlar yükleniyor...
            </div>
          ) : quickDescriptions.length === 0 ? (
            <div className="settings-empty">
              Henüz hazır açıklama eklenmedi.
            </div>
          ) : (
            quickDescriptions.map(
              (description) => (
                <div
                  className="description-item"
                  key={description}
                >
                  <span>{description}</span>

                  <button
                    type="button"
                    onClick={() =>
                      void handleDelete(
                        description
                      )
                    }
                    disabled={saving}
                    aria-label={`${description} açıklamasını sil`}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              )
            )
          )}
        </div>

        <footer className="settings-card-footer">
          {quickDescriptions.length} hazır açıklama
        </footer>
      </article>
    </section>
  );
}

export default SettingsPage;