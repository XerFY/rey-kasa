import { registerSW } from "virtual:pwa-register";

export function registerPWA(): void {
  registerSW({
    immediate: true,

    onRegisteredSW(
      _serviceWorkerUrl,
      registration
    ) {
      if (!registration) {
        return;
      }

      window.setInterval(() => {
        void registration.update();
      }, 60 * 60 * 1000);
    },

    onRegisterError(error) {
      console.error(
        "PWA kayıt hatası:",
        error
      );
    },
  });
}