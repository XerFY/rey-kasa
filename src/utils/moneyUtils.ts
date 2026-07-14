export function parseMoneyInput(
  input: string
): number | null {
  const compact = input
    .trim()
    .replace(/[\s₺]/g, "");

  if (
    !compact ||
    !/^-?[\d.,]+$/.test(compact)
  ) {
    return null;
  }

  const negative =
    compact.startsWith("-");
  const unsigned = negative
    ? compact.slice(1)
    : compact;

  if (!unsigned || unsigned.includes("-")) {
    return null;
  }

  const lastComma =
    unsigned.lastIndexOf(",");
  const lastDot =
    unsigned.lastIndexOf(".");

  let decimalIndex = -1;

  if (lastComma >= 0 && lastDot >= 0) {
    decimalIndex = Math.max(
      lastComma,
      lastDot
    );
  } else {
    const separatorIndex = Math.max(
      lastComma,
      lastDot
    );

    if (separatorIndex >= 0) {
      const separator =
        unsigned[separatorIndex];
      const groups =
        unsigned.split(separator);
      const finalGroup =
        groups.at(-1) ?? "";
      const looksLikeGrouping =
        finalGroup.length === 3 &&
        groups.length > 1 &&
        groups.slice(1).every(
          (group) =>
            group.length === 3
        );

      if (!looksLikeGrouping) {
        decimalIndex = separatorIndex;
      }
    }
  }

  const integerPart =
    (decimalIndex >= 0
      ? unsigned.slice(0, decimalIndex)
      : unsigned
    ).replace(/[.,]/g, "");

  const fractionPart =
    decimalIndex >= 0
      ? unsigned
          .slice(decimalIndex + 1)
          .replace(/[.,]/g, "")
      : "";

  if (
    !integerPart &&
    !fractionPart
  ) {
    return null;
  }

  const normalized =
    `${negative ? "-" : ""}${
      integerPart || "0"
    }${
      fractionPart
        ? `.${fractionPart}`
        : ""
    }`;

  const amount = Number(normalized);

  if (!Number.isFinite(amount)) {
    return null;
  }

  return Math.round(amount * 100) / 100;
}
