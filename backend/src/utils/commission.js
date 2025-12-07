import { Settings } from '../models/Settings.js';
import { emitMarketplaceSettingsUpdated } from '../services/socketService.js';

const DEFAULT_COMMISSION_PERCENT = 15;
const MARKETPLACE_SETTINGS_NAME = 'marketplace';

const normalizeSettings = (settings) => ({
  marketplaceCommissionPercent:
    typeof settings?.marketplaceCommissionPercent === 'number'
      ? settings.marketplaceCommissionPercent
      : DEFAULT_COMMISSION_PERCENT,
  marketplaceBalance:
    typeof settings?.marketplaceBalance === 'number' ? settings.marketplaceBalance : 0,
});

const ensureMarketplaceSettingsDocument = async () => {
  let settings = await Settings.findOne({ name: MARKETPLACE_SETTINGS_NAME });

  if (!settings) {
    settings = await Settings.create({
      name: MARKETPLACE_SETTINGS_NAME,
      marketplaceCommissionPercent: DEFAULT_COMMISSION_PERCENT,
      marketplaceBalance: 0,
    });
    return settings;
  }

  let needsSave = false;

  if (typeof settings.marketplaceCommissionPercent !== 'number') {
    settings.marketplaceCommissionPercent = DEFAULT_COMMISSION_PERCENT;
    needsSave = true;
  }

  if (typeof settings.marketplaceBalance !== 'number') {
    settings.marketplaceBalance = 0;
    needsSave = true;
  }

  if (needsSave) {
    await settings.save();
  }

  return settings;
};

export const getMarketplaceSettings = async () => {
  const settings = await ensureMarketplaceSettingsDocument();
  return normalizeSettings(settings);
};

export const getMarketplaceCommissionPercent = async () => {
  const { marketplaceCommissionPercent } = await getMarketplaceSettings();
  return marketplaceCommissionPercent;
};

export const updateMarketplaceCommissionPercent = async (percent) => {
  const settings = await Settings.findOneAndUpdate(
    { name: MARKETPLACE_SETTINGS_NAME },
    {
      $set: { marketplaceCommissionPercent: percent },
      $setOnInsert: {
        name: MARKETPLACE_SETTINGS_NAME,
        marketplaceBalance: 0,
      },
    },
    { new: true, upsert: true }
  );

  const normalized = normalizeSettings(settings);

  try {
    emitMarketplaceSettingsUpdated(normalized);
  } catch (error) {
    console.error('Failed to emit marketplace settings update:', error);
  }

  return normalized;
};

export const adjustMarketplaceBalance = async (delta) => {
  if (!delta || Number.isNaN(delta)) {
    return getMarketplaceSettings();
  }

  const settings = await ensureMarketplaceSettingsDocument();
  const nextBalance = Number(
    Math.max(0, (settings.marketplaceBalance || 0) + Number(delta)).toFixed(2)
  );

  settings.marketplaceBalance = nextBalance;
  await settings.save();

  const normalized = normalizeSettings(settings);

  try {
    emitMarketplaceSettingsUpdated(normalized);
  } catch (error) {
    console.error('Failed to emit marketplace settings update:', error);
  }

  return normalized;
};
