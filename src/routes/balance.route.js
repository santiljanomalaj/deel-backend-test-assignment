const express = require('express');
const router = express.Router();

const { getProfile } = require('../middleware/getProfile');

const { depositToClient } = require('../controllers/balance.controller');

router.post('/deposit/:userId', getProfile, depositToClient);

module.exports = router;
