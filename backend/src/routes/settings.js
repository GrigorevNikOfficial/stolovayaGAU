// src/routes/settings.js
import express from 'express';
import { authenticateToken, requireAdmin } from '../controllers/auth.js';
import { Settings } from '../models/Settings.js';
import {
    getMarketplaceSettings,
    updateMarketplaceCommissionPercent,
} from '../utils/commission.js';

const router = express.Router();

const serializeSettings = (settings) => ({
    deliveryEnabled: settings.deliveryEnabled,
    deliveryTimeStart: settings.deliveryTimeStart,
    deliveryTimeEnd: settings.deliveryTimeEnd,
    pickupTimeStart: settings.pickupTimeStart,
    pickupTimeEnd: settings.pickupTimeEnd,
    dineInTimeStart: settings.dineInTimeStart,
    dineInTimeEnd: settings.dineInTimeEnd,
    serviceFeeType: settings.serviceFeeType,
    serviceFeeValue: settings.serviceFeeValue,
    marketplaceCommissionPercent: settings.marketplaceCommissionPercent,
});

const ensureSettingsDocument = async (name, defaults = {}) => {
    let settings = await Settings.findOne({ name });

    if (!settings) {
        settings = await Settings.create({ name, ...defaults });
    }

    return settings;
};

// GET /api/settings/delivery - получить настройки доставки
router.get('/delivery', async (req, res) => {
    try {
        console.log('GET /api/settings/delivery - запрос получен');

        const settings = await ensureSettingsDocument('main');

        const payload = serializeSettings(settings);
        console.log('Отправляем настройки:', payload);
        res.json(payload);
    } catch (error) {
        console.error('Ошибка получения настроек:', error);
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/settings/delivery - обновить настройки доставки
router.put('/delivery', async (req, res) => {
    try {
        console.log('PUT /api/settings/delivery - запрос получен', req.body);

        const updatableFields = [
            'deliveryEnabled',
            'deliveryTimeStart',
            'deliveryTimeEnd',
            'pickupTimeStart',
            'pickupTimeEnd',
            'dineInTimeStart',
            'dineInTimeEnd',
            'serviceFeeType',
            'serviceFeeValue',
        ];

        const updatePayload = {};
        updatableFields.forEach((field) => {
            if (Object.prototype.hasOwnProperty.call(req.body, field)) {
                updatePayload[field] = req.body[field];
            }
        });

        if (Object.prototype.hasOwnProperty.call(updatePayload, 'serviceFeeValue')) {
            updatePayload.serviceFeeValue = Number(updatePayload.serviceFeeValue) || 0;
        }

        if (
            Object.prototype.hasOwnProperty.call(updatePayload, 'serviceFeeType') &&
            !['percent', 'fixed'].includes(updatePayload.serviceFeeType)
        ) {
            return res.status(400).json({ error: 'Некорректный тип сервисного сбора' });
        }

        if (Object.keys(updatePayload).length === 0) {
            return res.status(400).json({ error: 'Нет данных для обновления' });
        }

        const settings = await Settings.findOneAndUpdate(
            { name: 'main' },
            { $set: updatePayload, $setOnInsert: { name: 'main' } },
            { new: true, upsert: true }
        );

        const payload = serializeSettings(settings);
        console.log('Настройки обновлены:', payload);
        res.json(payload);
    } catch (error) {
        console.error('Ошибка обновления настроек:', error);
        res.status(400).json({ error: error.message });
    }
});

// GET /api/settings/marketplace - получить настройки маркетплейса (только админ)
router.get('/marketplace', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const settings = await getMarketplaceSettings();
        res.json(settings);
    } catch (error) {
        console.error('Ошибка получения настроек маркетплейса:', error);
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/settings/marketplace - обновить комиссию маркетплейса (только админ)
router.put('/marketplace', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { marketplaceCommissionPercent } = req.body;

        if (marketplaceCommissionPercent === undefined) {
            return res.status(400).json({ error: 'Не передано значение комиссии' });
        }

        const parsedValue = Number(marketplaceCommissionPercent);

        if (Number.isNaN(parsedValue) || parsedValue < 0 || parsedValue > 100) {
            return res.status(400).json({ error: 'Комиссия должна быть числом от 0 до 100' });
        }

        const settings = await updateMarketplaceCommissionPercent(parsedValue);

        res.json(settings);
    } catch (error) {
        console.error('Ошибка обновления настроек маркетплейса:', error);
        res.status(400).json({ error: error.message });
    }
});

export { router };
