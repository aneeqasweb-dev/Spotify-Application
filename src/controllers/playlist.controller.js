// Playlists: anyone logged in can make their own; editorial ones (with a curator) are shown to everyone
const playlistModel = require('../models/playlist.model');
const musicModel = require('../models/music.models');
const { uploadCover } = require('../services/storage.service');
const { PUBLIC_USER_FIELDS, TRACK_WITH_ARTIST, isId, isOwner } = require('../utils/query');

const POPULATE = [
    { path: 'owner', select: PUBLIC_USER_FIELDS },
    { path: 'tracks', populate: TRACK_WITH_ARTIST },
];

function loadPlaylist(id) {
    return playlistModel.findById(id).populate(POPULATE);
}

// Finds the playlist and checks the user owns it. Sends the error response itself and returns null on failure.
async function findOwnedPlaylist(req, res) {
    const { playlistId } = req.params;
    if (!isId(playlistId)) {
        res.status(404).json({ message: "Playlist not found" });
        return null;
    }
    const playlist = await playlistModel.findById(playlistId);
    if (!playlist) {
        res.status(404).json({ message: "Playlist not found" });
        return null;
    }
    if (!isOwner(playlist, req.user.id)) {
        res.status(403).json({ message: "You can only change your own playlists" });
        return null;
    }
    return playlist;
}

function cleanText(value, max) {
    return typeof value === 'string' ? value.trim().slice(0, max) : undefined;
}

// GET /api/playlists — your playlists + editorial playlists
async function listPlaylists(req, res) {
    const playlists = await playlistModel
        .find({ $or: [{ owner: req.user.id }, { curator: { $nin: ['', null] } }] })
        .sort({ updatedAt: -1 })
        .populate(POPULATE);

    return res.status(200).json({ message: "Playlists fetched successfully", playlists });
}

// POST /api/playlists  { name?, description? } (+ optional "cover" image)
async function createPlaylist(req, res) {
    let name = cleanText(req.body && req.body.name, 100);
    if (!name) {
        const count = await playlistModel.countDocuments({ owner: req.user.id });
        name = `My Playlist #${count + 1}`;
    }

    const coverUrl = req.file ? (await uploadCover(req.file.buffer)).url : '';

    const playlist = await playlistModel.create({
        name,
        description: cleanText(req.body && req.body.description, 300) || '',
        owner: req.user.id,
        tracks: [],
        coverUrl,
    });

    return res.status(201).json({
        message: "Playlist created successfully",
        playlist: await loadPlaylist(playlist._id),
    });
}

// GET /api/playlists/:playlistId
async function getPlaylist(req, res) {
    const { playlistId } = req.params;
    if (!isId(playlistId)) return res.status(404).json({ message: "Playlist not found" });

    const playlist = await loadPlaylist(playlistId);
    if (!playlist) return res.status(404).json({ message: "Playlist not found" });

    return res.status(200).json({ message: "Playlist fetched successfully", playlist });
}

// PATCH /api/playlists/:playlistId  { name?, description? } (+ optional "cover" image)
async function updatePlaylist(req, res) {
    const playlist = await findOwnedPlaylist(req, res);
    if (!playlist) return;

    const update = {};
    const name = cleanText(req.body && req.body.name, 100);
    const description = cleanText(req.body && req.body.description, 300);
    if (req.body && 'name' in req.body && !name) {
        return res.status(400).json({ message: "Playlist name can't be empty" });
    }
    if (name) update.name = name;
    if (description !== undefined) update.description = description;
    if (req.file) update.coverUrl = (await uploadCover(req.file.buffer)).url;

    await playlistModel.updateOne({ _id: playlist._id }, { $set: update });

    return res.status(200).json({
        message: "Playlist updated successfully",
        playlist: await loadPlaylist(playlist._id),
    });
}

// DELETE /api/playlists/:playlistId
async function deletePlaylist(req, res) {
    const playlist = await findOwnedPlaylist(req, res);
    if (!playlist) return;

    await playlistModel.deleteOne({ _id: playlist._id });
    return res.status(200).json({ message: "Playlist deleted", playlistId: String(playlist._id) });
}

// POST /api/playlists/:playlistId/tracks  { trackId }
async function addTrack(req, res) {
    const trackId = req.body && req.body.trackId;
    if (!isId(trackId)) return res.status(400).json({ message: "Invalid song id" });

    const playlist = await findOwnedPlaylist(req, res);
    if (!playlist) return;

    if (playlist.tracks.some((id) => String(id) === String(trackId))) {
        return res.status(409).json({ message: "This song is already in the playlist" });
    }
    const exists = await musicModel.exists({ _id: trackId });
    if (!exists) return res.status(404).json({ message: "Song not found" });

    await playlistModel.updateOne({ _id: playlist._id }, { $push: { tracks: trackId } });

    return res.status(200).json({
        message: `Added to ${playlist.name}`,
        playlist: await loadPlaylist(playlist._id),
    });
}

// DELETE /api/playlists/:playlistId/tracks/:trackId
async function removeTrack(req, res) {
    const { trackId } = req.params;
    if (!isId(trackId)) return res.status(400).json({ message: "Invalid song id" });

    const playlist = await findOwnedPlaylist(req, res);
    if (!playlist) return;

    await playlistModel.updateOne({ _id: playlist._id }, { $pull: { tracks: trackId } });

    return res.status(200).json({
        message: `Removed from ${playlist.name}`,
        playlist: await loadPlaylist(playlist._id),
    });
}

module.exports = {
    listPlaylists, createPlaylist, getPlaylist, updatePlaylist, deletePlaylist, addTrack, removeTrack,
};
