// src/routes/settings.js
import express from 'express';
import { Settings } from '../models/Settings.js'; // Именованный импорт

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
});

// GET /api/settings/delivery - получить настройки доставки
router.get('/delivery', async (req, res) => {
    try {
        console.log('GET /api/settings/delivery - запрос получен');

        let settings = await Settings.findOne({ name: 'main' });

        if (!settings) {
            console.log('Настройки не найдены, создаем по умолчанию');
            settings = await Settings.create({ name: 'main' });
        }

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

export { router };
