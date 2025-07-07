const express = require('express');
const router = express.Router();
const { uploadMedia } = require('../controllers/uploadController');

router.post('/media', uploadMedia);

module.exports = router; 