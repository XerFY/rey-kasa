import {
  Component,
  type ErrorInfo,
  type ReactNode,
} from "react";

import {
  RefreshCw,
  ShieldAlert,
  Wrench,
} from "lucide-react";

import "../styles/AppErrorBoundary.css";

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
};

class AppErrorBoundary extends Component<
  Props,
  State
> {
  state: State = {
    hasError: false,
  };

  static getDerivedStateFromError():
    State {
    return {
      hasError: true,
    };
  }

  componentDidCatch(
    error: Error,
    information: ErrorInfo
  ) {
    console.error(
      "REY KASA uygulama hatası:",
      error,
      information
    );
  }

  private reloadApplication = () => {
    window.location.reload();
  };

  private clearUpdateAndReload =
    async () => {
      try {
        if (
          "serviceWorker" in navigator
        ) {
          const registrations =
            await navigator.serviceWorker
              .getRegistrations();

          await Promise.all(
            registrations.map(
              (registration) =>
                registration.unregister()
            )
          );
        }

        if ("caches" in window) {
          const cacheNames =
            await caches.keys();

          await Promise.all(
            cacheNames.map(
              (cacheName) =>
                caches.delete(cacheName)
            )
          );
        }
      } finally {
        window.location.replace(
          `/?refresh=${Date.now()}`
        );
      }
    };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <main className="error-boundary">
        <section className="error-boundary-card">
          <div className="error-boundary-icon">
            <ShieldAlert size={31} />
          </div>

          <span>REY KASA</span>

          <h1>
            Uygulama yenilenmeli
          </h1>

          <p>
            Verilerin silinmedi. Geçici
            bir görüntüleme veya
            güncelleme sorunu oluştu.
          </p>

          <button
            type="button"
            className="error-reload"
            onClick={
              this.reloadApplication
            }
          >
            <RefreshCw size={19} />
            Uygulamayı Yenile
          </button>

          <button
            type="button"
            className="error-clear"
            onClick={
              this.clearUpdateAndReload
            }
          >
            <Wrench size={18} />
            Güncellemeyi Temizle
          </button>

          <small>
            Bu işlemler Firebase’deki
            kasa kayıtlarını silmez.
          </small>
        </section>
      </main>
    );
  }
}

export default AppErrorBoundary;