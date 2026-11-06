const mongoose = require('mongoose');
const musicModel = require('../models/music.models');
const albumModel = require('../models/album.model');
const playlistModel = require('../models/playlist.model');
const userModel = require('../models/user.model');
const { uploadFile, uploadCover } = require('../services/storage.service');
const { readAudioMetadata } = require('../services/metadata.service');
const { PUBLIC_USER_FIELDS, TRACK_WITH_ARTIST, isId, isOwner } = require('../utils/query');

// Only these artist fields are sent to the client (never the password hash)
const ARTIST_FIELDS = PUBLIC_USER_FIELDS;

function getTokenFromRequest(req) {
    const cookieToken = req.cookies && req.cookies.token;
    if (cookieToken) {
        return cookieToken;
    }

    return null;
}

// Uploads a cover picture, but never fails the whole request if only the picture fails
async function tryUploadCover(buffer) {
    try {
        const result = await uploadCover(buffer);
        return result.url;
    } catch (err) {
        console.warn('Cover upload failed:', err.message);
        return '';
    }
}

// POST /api/music/upload  (form-data: music = audio file, title = text, cover = optional image)
async function createMusic(req, res) {

    const file = req.files && req.files.music && req.files.music[0];
    const coverFile = req.files && req.files.cover && req.files.cover[0];

    if (!file) {
        return res.status(400).json({ message: "Please choose an audio file to upload" });
    }

    // Read the title / artist / length / picture stored inside the song file
    const meta = await readAudioMetadata(file.buffer, file.mimetype);

    const typedTitle = req.body && typeof req.body.title === 'string' ? req.body.title.trim() : '';
    const title = typedTitle || meta.title;
    if (!title) {
        return res.status(400).json({ message: "Track title is required" });
    }

    // The picture the artist chose wins; otherwise use the one inside the file
    const coverBuffer = coverFile ? coverFile.buffer : meta.picture && meta.picture.data;

    const [result, coverUrl] = await Promise.all([
        uploadFile(file.buffer.toString('base64')),
        coverBuffer ? tryUploadCover(coverBuffer) : Promise.resolve(''),
    ]);

    const typedGenre = req.body && typeof req.body.genre === 'string' ? req.body.genre.trim().slice(0, 40) : '';

    const music = await musicModel.create({
        uri: result.url,
        title,
        artist: req.user.id,
        coverUrl,
        duration: meta.duration,
        artistName: meta.artist,
        genre: typedGenre || meta.genre,
    });

    return res.status(201).json({
        message: "Music created successfully",
        music: {
            id: music._id,
            title: music.title,
            uri: music.uri,
            artist: music.artist,
            coverUrl: music.coverUrl,
            duration: music.duration,
            artistName: music.artistName,
            genre: music.genre,
        }
    })
}

// Track IDs can arrive as a JSON array, or (from a form) as '["id1","id2"]' or "id1,id2"
function parseIds(value) {
    if (Array.isArray(value)) return value;
    if (typeof value !== 'string' || !value.trim()) return [];
    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return value.split(',').map((id) => id.trim()).filter(Boolean);
    }
}

// POST /api/music/album  (JSON { title, musics }, or form-data with an optional cover image)
async function createAlbum(req, res) {

    const { title } = req.body || {};
    const musics = parseIds(req.body && req.body.musics);

    if (typeof title !== 'string' || !title.trim()) {
        return res.status(400).json({ message: "Album title is required" });
    }
    if (musics.length === 0) {
        return res.status(400).json({ message: "Add at least one track to the album" });
    }
    if (!musics.every((id) => mongoose.isValidObjectId(id))) {
        return res.status(400).json({ message: "One or more track IDs are invalid" });
    }

    const coverUrl = req.file ? await tryUploadCover(req.file.buffer) : '';

    const album = await albumModel.create({
        title: title.trim(),
        musics: musics,
        artist: req.user.id,
        coverUrl,
    });

    return res.status(201).json({
        message: "Album created successfully",
        album: {
            id: album._id,
            title: album.title,
            musics: album.musics,
            artist: album.artist,
            coverUrl: album.coverUrl,
        }
    })
}

// GET /api/music?limit=50&skip=0  (newest first)
async function getAllMusic(req, res) {

    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 200);
    const skip = Math.max(parseInt(req.query.skip, 10) || 0, 0);

    const musics = await musicModel
        .find()
        .sort({ _id: -1 })
        .skip(skip)
        .limit(limit)
        .populate('artist', ARTIST_FIELDS);

    return res.status(200).json({
        message: "All music fetched successfully",
        musics: musics,
    })
}

async function getAllAlbums(req, res) {

    const albums = await albumModel
        .find()
        .sort({ _id: -1 })
        .select('title musics artist coverUrl')
        .populate('artist', ARTIST_FIELDS)
        .populate({ path: 'musics', populate: { path: 'artist', select: ARTIST_FIELDS } });

    return res.status(200).json({
        message: "Albums fetched successfully",
        albums: albums,
    })
}

async function getAlbumById(req, res) {

    const { albumId } = req.params;

    if (!mongoose.isValidObjectId(albumId)) {
        return res.status(404).json({ message: "Album not found" });
    }

    const album = await albumModel
        .findById(albumId)
        .populate('artist', ARTIST_FIELDS)
        .populate({ path: 'musics', populate: { path: 'artist', select: ARTIST_FIELDS } });

    if (!album) {
        return res.status(404).json({ message: "Album not found" });
    }

    return res.status(200).json({
        message: "Album fetched successfully",
        album: album,
    })
}

/* ---------- Artists managing their own songs & albums ---------- */

// Loads a document and checks the logged-in artist owns it (field "artist").
// Sends the error response itself and returns null on failure.
async function findOwned(model, id, req, res, label) {
    if (!isId(id)) {
        res.status(404).json({ message: `${label} not found` });
        return null;
    }
    const doc = await model.findById(id);
    if (!doc) {
        res.status(404).json({ message: `${label} not found` });
        return null;
    }
    if (!isOwner(doc, req.user.id, 'artist')) {
        res.status(403).json({ message: `You can only change your own ${label.toLowerCase()}s` });
        return null;
    }
    return doc;
}

// PATCH /api/music/:musicId  { title?, genre? } (+ optional "cover" image)
async function updateMusic(req, res) {
    const music = await findOwned(musicModel, req.params.musicId, req, res, 'Song');
    if (!music) return;

    const update = {};
    const body = req.body || {};
    if ('title' in body) {
        const title = String(body.title).trim();
        if (!title) return res.status(400).json({ message: "Song title can't be empty" });
        update.title = title.slice(0, 120);
    }
    if ('genre' in body) update.genre = String(body.genre).trim().slice(0, 40);
    if (req.file) update.coverUrl = (await uploadCover(req.file.buffer)).url;

    const updated = await musicModel
        .findByIdAndUpdate(music._id, { $set: update }, { returnDocument: 'after' })
        .populate(TRACK_WITH_ARTIST);

    return res.status(200).json({ message: "Song updated", music: updated });
}

// DELETE /api/music/:musicId — also removes it from albums, playlists and likes
async function deleteMusic(req, res) {
    const music = await findOwned(musicModel, req.params.musicId, req, res, 'Song');
    if (!music) return;

    await Promise.all([
        musicModel.deleteOne({ _id: music._id }),
        albumModel.updateMany({ musics: music._id }, { $pull: { musics: music._id } }),
        playlistModel.updateMany({ tracks: music._id }, { $pull: { tracks: music._id } }),
        userModel.updateMany({}, { $pull: { likedTracks: music._id, recentlyPlayed: { track: music._id } } }),
    ]);

    return res.status(200).json({ message: "Song deleted", musicId: String(music._id) });
}

// PATCH /api/music/albums/:albumId  { title? } (+ optional "cover" image)
async function updateAlbum(req, res) {
    const album = await findOwned(albumModel, req.params.albumId, req, res, 'Album');
    if (!album) return;

    const update = {};
    const body = req.body || {};
    if ('title' in body) {
        const title = String(body.title).trim();
        if (!title) return res.status(400).json({ message: "Album title can't be empty" });
        update.title = title.slice(0, 120);
    }
    if (req.file) update.coverUrl = (await uploadCover(req.file.buffer)).url;

    const updated = await albumModel
        .findByIdAndUpdate(album._id, { $set: update }, { returnDocument: 'after' })
        .populate('artist', ARTIST_FIELDS)
        .populate({ path: 'musics', populate: TRACK_WITH_ARTIST });

    return res.status(200).json({ message: "Album updated", album: updated });
}

// DELETE /api/music/albums/:albumId — the songs themselves stay
async function deleteAlbum(req, res) {
    const album = await findOwned(albumModel, req.params.albumId, req, res, 'Album');
    if (!album) return;

    await albumModel.deleteOne({ _id: album._id });
    return res.status(200).json({ message: "Album deleted", albumId: String(album._id) });
}

module.exports = {
    createMusic, createAlbum, getTokenFromRequest, getAllMusic, getAllAlbums, getAlbumById,
    updateMusic, deleteMusic, updateAlbum, deleteAlbum,
}
