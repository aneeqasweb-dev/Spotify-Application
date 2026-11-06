const express = require('express');
const musicController = require('../controllers/music.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');

const router = express.Router();

// Artists: publish
router.post(
    "/upload",
    authMiddleware.authArtist,
    upload.fields([{ name: 'music', maxCount: 1 }, { name: 'cover', maxCount: 1 }]),
    musicController.createMusic
);
// JSON still works; form-data is only needed when sending an album cover picture
router.post("/album", authMiddleware.authArtist, upload.single("cover"), musicController.createAlbum);

// Everyone logged in: browse
router.get("/", authMiddleware.authUser, musicController.getAllMusic);
router.get("/albums", authMiddleware.authUser, musicController.getAllAlbums);
router.get("/albums/:albumId", authMiddleware.authUser, musicController.getAlbumById);

// Artists: manage their own albums and songs
router.patch("/albums/:albumId", authMiddleware.authArtist, upload.single("cover"), musicController.updateAlbum);
router.delete("/albums/:albumId", authMiddleware.authArtist, musicController.deleteAlbum);
router.patch("/:musicId", authMiddleware.authArtist, upload.single("cover"), musicController.updateMusic);
router.delete("/:musicId", authMiddleware.authArtist, musicController.deleteMusic);

module.exports = router;
