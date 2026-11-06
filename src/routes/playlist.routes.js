const express = require('express');
const playlistController = require('../controllers/playlist.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');

const router = express.Router();

router.use(authMiddleware.authUser);

router.get('/', playlistController.listPlaylists);
router.post('/', upload.single('cover'), playlistController.createPlaylist);
router.get('/:playlistId', playlistController.getPlaylist);
router.patch('/:playlistId', upload.single('cover'), playlistController.updatePlaylist);
router.delete('/:playlistId', playlistController.deletePlaylist);
router.post('/:playlistId/tracks', playlistController.addTrack);
router.delete('/:playlistId/tracks/:trackId', playlistController.removeTrack);

module.exports = router;
