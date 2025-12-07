const BALANCE_CAP = 10_000_000;
const cappedLabel = '10+ млн ₽';

const integerFormatter = new Intl.NumberFormat('ru-RU', {
  maximumFractionDigits: 0,
});

const decimalFormatter = new Intl.NumberFormat('ru-RU', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export type FormatBalanceOptions = {
  withDecimals?: boolean;
};

export const formatBalance = (
  rawValue: number | null | undefined,
  options?: FormatBalanceOptions
): string => {
  const safeValue = Number(rawValue ?? 0);
  if (!Number.isFinite(safeValue)) {
    return options?.withDecimals ? '0,00 ₽' : '0 ₽';
  }

  if (safeValue >= BALANCE_CAP) {
    return cappedLabel;
  }

  const formatter = options?.withDecimals ? decimalFormatter : integerFormatter;
  return `${formatter.format(safeValue)} ₽`;
};
