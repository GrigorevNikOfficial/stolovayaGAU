// controllers/settingsController.js
const Settings = require('../models/Settings');

const getDeliverySettings = async (req, res) => {
    try {
        let settings = await Settings.findOne({ name: 'main' });

        if (!settings) {
            settings = await Settings.create({ name: 'main' });
        }

        res.json({
            deliveryEnabled: settings.deliveryEnabled,
            deliveryTimeStart: settings.deliveryTimeStart,
            deliveryTimeEnd: settings.deliveryTimeEnd
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateDeliverySettings = async (req, res) => {
    try {
        const { deliveryEnabled, deliveryTimeStart, deliveryTimeEnd } = req.body;

        const settings = await Settings.findOneAndUpdate(
            { name: 'main' },
            {
                deliveryEnabled,
                deliveryTimeStart,
                deliveryTimeEnd,
                updatedBy: req.user._id
            },
            { new: true, upsert: true }
        );

        res.json({
            deliveryEnabled: settings.deliveryEnabled,
            deliveryTimeStart: settings.deliveryTimeStart,
            deliveryTimeEnd: settings.deliveryTimeEnd
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

module.exports = {
    getDeliverySettings,
    updateDeliverySettings
};