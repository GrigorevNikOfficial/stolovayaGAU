// src/routes/settings.js
import express from 'express';
import { Settings } from '../models/Settings.js'; // Именованный импорт

const router = express.Router();

// GET /api/settings/delivery - получить настройки доставки
router.get('/delivery', async (req, res) => {
    try {
        console.log('GET /api/settings/delivery - запрос получен');

        let settings = await Settings.findOne({ name: 'main' });

        if (!settings) {
            console.log('Настройки не найдены, создаем по умолчанию');
            settings = await Settings.create({
                name: 'main',
                deliveryEnabled: false,
                deliveryTimeStart: "08:00",
                deliveryTimeEnd: "10:00"
            });
        }

        console.log('Отправляем настройки:', settings);
        res.json({
            deliveryEnabled: settings.deliveryEnabled,
            deliveryTimeStart: settings.deliveryTimeStart,
            deliveryTimeEnd: settings.deliveryTimeEnd
        });
    } catch (error) {
        console.error('Ошибка получения настроек:', error);
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/settings/delivery - обновить настройки доставки
router.put('/delivery', async (req, res) => {
    try {
        console.log('PUT /api/settings/delivery - запрос получен', req.body);

        const { deliveryEnabled, deliveryTimeStart, deliveryTimeEnd } = req.body;

        const settings = await Settings.findOneAndUpdate(
            { name: 'main' },
            {
                deliveryEnabled,
                deliveryTimeStart,
                deliveryTimeEnd
            },
            { new: true, upsert: true }
        );

        console.log('Настройки обновлены:', settings);
        res.json({
            deliveryEnabled: settings.deliveryEnabled,
            deliveryTimeStart: settings.deliveryTimeStart,
            deliveryTimeEnd: settings.deliveryTimeEnd
        });
    } catch (error) {
        console.error('Ошибка обновления настроек:', error);
        res.status(400).json({ error: error.message });
    }
});

export { router };