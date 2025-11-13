// routes/settings.js
const express = require('express');
const router = express.Router();
const { getDeliverySettings, updateDeliverySettings } = require('../controllers/settingsController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// Правильные пути
router.get('/delivery', getDeliverySettings);
router.put('/delivery', auth, admin, updateDeliverySettings);

module.exports = router;