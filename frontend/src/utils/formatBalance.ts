const BALANCE_CAP = 10_000_000;
const cappedLabel = '10+ млн';
const DEFAULT_COMPACT_THRESHOLD = 100_000;

const integerFormatter = new Intl.NumberFormat('ru-RU', {
  maximumFractionDigits: 0,
});

const decimalFormatter = new Intl.NumberFormat('ru-RU', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const compactFormatter = new Intl.NumberFormat('ru-RU', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

export type FormatBalanceOptions = {
  withDecimals?: boolean;
  compact?: boolean;
  compactThreshold?: number;
};

export const formatBalance = (
  rawValue: number | null | undefined,
  options?: FormatBalanceOptions
): string => {
  const safeValue = Number(rawValue ?? 0);
  if (!Number.isFinite(safeValue)) {
    return options?.withDecimals ? '0,00' : '0';
  }

  const shouldUseCompact = Boolean(options?.compact) &&
    Math.abs(safeValue) >= (options?.compactThreshold ?? DEFAULT_COMPACT_THRESHOLD);

  if (shouldUseCompact) {
    return compactFormatter.format(safeValue);
  }

  if (safeValue >= BALANCE_CAP) {
    return cappedLabel;
  }

  const formatter = options?.withDecimals ? decimalFormatter : integerFormatter;
  return formatter.format(safeValue);
};
