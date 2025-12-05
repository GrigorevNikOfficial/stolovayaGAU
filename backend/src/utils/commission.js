import { Settings } from '../models/Settings.js';

const DEFAULT_COMMISSION_PERCENT = 15;

export const getMarketplaceCommissionPercent = async () => {
  const settings = await Settings.findOne({ name: 'services' });
  const percent = settings?.marketplaceCommissionPercent;

  if (typeof percent === 'number' && percent >= 0 && percent <= 100) {
    return percent;
  }

  return DEFAULT_COMMISSION_PERCENT;
};
