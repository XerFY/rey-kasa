import {
  ChartNoAxesColumnIncreasing,
  House,
  List,
  Settings,
} from "lucide-react";

import "../styles/BottomNavigation.css";

export type AppPage = "home" | "transactions" | "reports" | "settings";

type Props = {
  activePage: AppPage;
  onChange: (page: AppPage) => void;
};

function BottomNavigation({ activePage, onChange }: Props) {
  const items = [
    {
      id: "home" as const,
      label: "Ana Sayfa",
      icon: House,
    },
    {
      id: "transactions" as const,
      label: "İşlemler",
      icon: List,
    },
    {
      id: "reports" as const,
      label: "Raporlar",
      icon: ChartNoAxesColumnIncreasing,
    },
    {
      id: "settings" as const,
      label: "Ayarlar",
      icon: Settings,
    },
  ];

  return (
    <nav className="bottom-navigation">
      {items.map((item) => {
        const Icon = item.icon;
        const active = activePage === item.id;

        return (
          <button
            key={item.id}
            type="button"
            className={`bottom-navigation-item ${active ? "active" : ""}`}
            onClick={() => onChange(item.id)}
          >
            <Icon size={21} strokeWidth={active ? 2.4 : 1.8} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export default BottomNavigation;