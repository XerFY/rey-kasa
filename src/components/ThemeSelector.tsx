import "../styles/ThemeSelector.css";

import type {
  ThemeMode,
} from "../types/AppSettings";

type Props = {
  value: ThemeMode;
  disabled?: boolean;

  onChange: (
    theme: ThemeMode
  ) => void;
};

type ThemeOption = {
  id: ThemeMode;
  name: string;
  description: string;
  colors: [
    string,
    string,
    string,
  ];
};

const themeOptions:
  ThemeOption[] = [
    {
      id: "light",
      name: "Açık İnci",
      description:
        "Ferah ve aydınlık",
      colors: [
        "#eef2f6",
        "#ffffff",
        "#916b13",
      ],
    },
    {
      id: "dark",
      name: "Koyu Grafit",
      description:
        "Sade ve güçlü",
      colors: [
        "#171a20",
        "#2a303a",
        "#e1c15c",
      ],
    },
    {
      id: "emerald",
      name: "Zümrüt Altın",
      description:
        "Kuyumcuya özel",
      colors: [
        "#0b1714",
        "#16312a",
        "#e2c56a",
      ],
    },
    {
      id: "midnight",
      name: "Safir Gece",
      description:
        "Lacivert ve modern",
      colors: [
        "#0b1020",
        "#1b2744",
        "#8fb4ff",
      ],
    },
    {
      id: "burgundy",
      name: "Bordo Altın",
      description:
        "Sıcak ve seçkin",
      colors: [
        "#1b0f14",
        "#3a1e2a",
        "#f0c978",
      ],
    },
    {
      id: "system",
      name: "Otomatik",
      description:
        "Telefonu takip eder",
      colors: [
        "#eef2f6",
        "#171a20",
        "#c79a2b",
      ],
    },
  ];

function ThemeSelector({
  value,
  disabled = false,
  onChange,
}: Props) {
  return (
    <div
      className="theme-picker"
      role="radiogroup"
      aria-label="Tema seçimi"
    >
      {themeOptions.map(
        (theme) => {
          const active =
            value === theme.id;

          return (
            <button
              key={theme.id}
              type="button"
              role="radio"
              aria-checked={active}
              className={`theme-option ${
                active
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                onChange(theme.id)
              }
              disabled={disabled}
            >
              <span
                className="theme-option-preview"
                aria-hidden="true"
              >
                {theme.colors.map(
                  (
                    color,
                    index
                  ) => (
                    <i
                      key={`${theme.id}-${color}`}
                      style={{
                        backgroundColor:
                          color,
                      }}
                      className={`theme-color-${
                        index + 1
                      }`}
                    />
                  )
                )}
              </span>

              <span className="theme-option-copy">
                <strong>
                  {theme.name}
                </strong>

                <small>
                  {
                    theme.description
                  }
                </small>
              </span>

              <span
                className="theme-option-check"
                aria-hidden="true"
              >
                {active ? "✓" : ""}
              </span>
            </button>
          );
        }
      )}
    </div>
  );
}

export default ThemeSelector;