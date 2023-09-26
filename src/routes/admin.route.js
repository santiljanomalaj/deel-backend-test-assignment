const express = require('express');
const router = express.Router();

const { getProfile } = require('../middleware/getProfile');

const {
    getBestProfession,
    getBestClients
} = require('../controllers/admin.controller');

router.get('/best-profession', getProfile, getBestProfession);
router.get('/best-clients', getProfile, getBestClients);

module.exports = router;
