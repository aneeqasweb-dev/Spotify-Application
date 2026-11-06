const express = require('express');
const publicController = require('../controllers/public.controller');

const router = express.Router();

router.get('/highlights', publicController.getHighlights);

module.exports = router;
