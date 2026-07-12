import {
  Cloud,
  CloudOff,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import "../styles/ConnectionStatus.css";

type Props = {
  loading: boolean;
  syncError: string;
  hasPendingWrites?: boolean;
};

function ConnectionStatus({
  loading,
  syncError,
  hasPendingWrites = false,
}: Props) {
  const [
    isOnline,
    setIsOnline,
  ] = useState(
    () => navigator.onLine
  );

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
    }

    function handleOffline() {
      setIsOnline(false);
    }

    window.addEventListener(
      "online",
      handleOnline
    );

    window.addEventListener(
      "offline",
      handleOffline
    );

    return () => {
      window.removeEventListener(
        "online",
        handleOnline
      );

      window.removeEventListener(
        "offline",
        handleOffline
      );
    };
  }, []);

  if (!isOnline) {
    return (
      <div className="connection-status connection-offline">
        <CloudOff size={15} />

        <span>
          İnternet yok — işlemler
          cihazda saklanıyor
        </span>
      </div>
    );
  }

  if (syncError) {
    return (
      <div className="connection-status connection-error">
        <CloudOff size={15} />
        <span>{syncError}</span>
      </div>
    );
  }

  if (
    loading ||
    hasPendingWrites
  ) {
    return (
      <div className="connection-status connection-loading">
        {loading ? (
          <LoaderCircle
            className="connection-spinner"
            size={15}
          />
        ) : (
          <RefreshCw
            className="connection-spinner"
            size={15}
          />
        )}

        <span>
          {loading
            ? "Buluta bağlanıyor..."
            : "Değişiklikler gönderiliyor..."}
        </span>
      </div>
    );
  }

  return (
    <div className="connection-status connection-online">
      <Cloud size={15} />
      <span>Bulut senkronize</span>
    </div>
  );
}

export default ConnectionStatus;