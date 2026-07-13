import {
  useRef,
  useState,
  type ChangeEvent,
} from "react";

import {
  ArchiveRestore,
  DatabaseBackup,
  Download,
  FileCheck2,
  ShieldCheck,
  Upload,
  X,
} from "lucide-react";

import "../styles/BackupManager.css";

import {
  downloadBackup,
  readBackupFile,
  restoreBackup,
  type ReyKasaBackup,
} from "../services/backupService";

type PendingBackup = {
  fileName: string;
  backup: ReyKasaBackup;
};

function BackupManager() {
  const fileInputRef =
    useRef<HTMLInputElement>(null);

  const [
    pendingBackup,
    setPendingBackup,
  ] = useState<PendingBackup | null>(
    null
  );

  const [
    exporting,
    setExporting,
  ] = useState(false);

  const [
    restoring,
    setRestoring,
  ] = useState(false);

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  async function handleDownload() {
    if (exporting) return;

    try {
      setExporting(true);
      setMessage("");
      setError("");

      await downloadBackup();

      setMessage(
        "Yedek dosyası hazırlandı."
      );
    } catch (downloadError) {
      if (
        downloadError instanceof DOMException &&
        downloadError.name ===
          "AbortError"
      ) {
        return;
      }

      setError(
        downloadError instanceof Error
          ? downloadError.message
          : "Yedek oluşturulamadı."
      );
    } finally {
      setExporting(false);
    }
  }

  async function handleFileChange(
    event:
      ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file) return;

    try {
      setMessage("");
      setError("");

      const backup =
        await readBackupFile(file);

      setPendingBackup({
        fileName: file.name,
        backup,
      });
    } catch (fileError) {
      setPendingBackup(null);

      setError(
        fileError instanceof Error
          ? fileError.message
          : "Yedek dosyası okunamadı."
      );
    }
  }

  function cancelRestore() {
    setPendingBackup(null);

    if (fileInputRef.current) {
      fileInputRef.current.value =
        "";
    }
  }

  async function confirmRestore() {
    if (
      !pendingBackup ||
      restoring
    ) {
      return;
    }

    try {
      setRestoring(true);
      setMessage("");
      setError("");

      await restoreBackup(
        pendingBackup.backup
      );

      setPendingBackup(null);

      setMessage(
        "Yedek başarıyla geri yüklendi. Uygulama yenileniyor."
      );

      window.setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (restoreError) {
      setError(
        restoreError instanceof Error
          ? restoreError.message
          : "Yedek geri yüklenemedi."
      );
    } finally {
      setRestoring(false);
    }
  }

  return (
    <article className="settings-card backup-manager">
      <div className="settings-card-title">
        <div className="settings-card-icon">
          <DatabaseBackup size={22} />
        </div>

        <div>
          <h2>Yedekleme</h2>

          <p>
            Kasa verilerini dosyaya
            kaydet veya geri yükle.
          </p>
        </div>
      </div>

      <div className="backup-security-note">
        <ShieldCheck size={18} />

        <span>
          İşlemler, gün sonları ve
          ayarlar yedeklenir.
        </span>
      </div>

      <div className="backup-actions">
        <button
          type="button"
          className="backup-download"
          onClick={handleDownload}
          disabled={
            exporting ||
            restoring
          }
        >
          <Download size={19} />

          {exporting
            ? "Hazırlanıyor..."
            : "Yedeği İndir"}
        </button>

        <button
          type="button"
          className="backup-upload"
          onClick={() =>
            fileInputRef.current?.click()
          }
          disabled={
            exporting ||
            restoring
          }
        >
          <Upload size={19} />
          Yedekten Geri Yükle
        </button>
      </div>

      <input
        ref={fileInputRef}
        className="backup-file-input"
        type="file"
        accept=".json,application/json"
        onChange={handleFileChange}
      />

      {pendingBackup && (
        <div className="backup-confirmation">
          <button
            type="button"
            className="backup-confirmation-close"
            onClick={cancelRestore}
            aria-label="Kapat"
          >
            <X size={18} />
          </button>

          <FileCheck2 size={26} />

          <h3>
            Yedek dosyası hazır
          </h3>

          <p>
            {pendingBackup.fileName}
          </p>

          <div className="backup-counts">
            <span>
              {
                pendingBackup.backup
                  .transactions.length
              }{" "}
              işlem
            </span>

            <span>
              {
                pendingBackup.backup
                  .dayEnds.length
              }{" "}
              gün sonu
            </span>
          </div>

          <button
            type="button"
            className="backup-restore-confirm"
            onClick={confirmRestore}
            disabled={restoring}
          >
            <ArchiveRestore size={19} />

            {restoring
              ? "Geri yükleniyor..."
              : "Geri Yüklemeyi Onayla"}
          </button>
        </div>
      )}

      {message && (
        <div className="backup-message">
          {message}
        </div>
      )}

      {error && (
        <div className="backup-error">
          {error}
        </div>
      )}
    </article>
  );
}

export default BackupManager;