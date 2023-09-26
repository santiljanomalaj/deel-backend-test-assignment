const express = require('express');
const router = express.Router();

const { getProfile } = require('../middleware/getProfile');

const {
    getContractById,
    getContractsByProfile
} = require('../controllers/contract.controller')

router.get('/:id', getProfile, getContractById);
router.get('/', getProfile, getContractsByProfile);

module.exports = router;
