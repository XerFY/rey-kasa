import {
  BellRing,
  Receipt,
  X,
} from "lucide-react";

import "../styles/DayEndReminderBanner.css";

type Props = {
  visible: boolean;
  onOpenDayEnd: () => void;
  onDismiss: () => void;
};

function DayEndReminderBanner({
  visible,
  onOpenDayEnd,
  onDismiss,
}: Props) {
  if (!visible) return null;

  return (
    <aside className="day-reminder-banner">
      <div className="day-reminder-icon">
        <BellRing size={21} />
      </div>

      <div className="day-reminder-content">
        <strong>
          Gün sonu zamanı
        </strong>

        <span>
          Bugünün raporu henüz
          oluşturulmadı.
        </span>
      </div>

      <button
        type="button"
        className="day-reminder-open"
        onClick={onOpenDayEnd}
      >
        <Receipt size={17} />
        Aç
      </button>

      <button
        type="button"
        className="day-reminder-close"
        onClick={onDismiss}
        aria-label="Hatırlatıcıyı kapat"
      >
        <X size={17} />
      </button>
    </aside>
  );
}

export default DayEndReminderBanner;