const express = require('express');
const meController = require('../controllers/me.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(authMiddleware.authUser);

// Liked Songs
router.get('/likes', meController.getLikes);
router.put('/likes/:trackId', meController.likeTrack);
router.delete('/likes/:trackId', meController.unlikeTrack);

// Recently played (+ play counts)
router.get('/history', meController.getHistory);
router.post('/history/:trackId', meController.recordPlay);

module.exports = router;
