const express = require('express');
const { getProfile, updateProfile, deleteProfile } = require('../controllers/profileController');
const router = express.Router();

router.get('/:userId', getProfile);
router.post('/', updateProfile);
router.delete('/', deleteProfile);

module.exports = router; 