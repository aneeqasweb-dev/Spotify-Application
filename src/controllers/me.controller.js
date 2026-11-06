// Things that belong to the logged-in listener: Liked Songs and Recently played
const userModel = require('../models/user.model');
const musicModel = require('../models/music.models');
const { TRACK_WITH_ARTIST, isId } = require('../utils/query');

// GET /api/me/likes
async function getLikes(req, res) {
    const user = await userModel
        .findById(req.user.id)
        .select('likedTracks')
        .populate({ path: 'likedTracks', populate: TRACK_WITH_ARTIST });

    if (!user) return res.status(401).json({ message: "Unauthorized" });

    return res.status(200).json({
        message: "Liked songs fetched successfully",
        tracks: user.likedTracks.filter(Boolean), // songs deleted since are skipped
    });
}

// PUT /api/me/likes/:trackId
async function likeTrack(req, res) {
    const { trackId } = req.params;
    if (!isId(trackId)) return res.status(400).json({ message: "Invalid song id" });

    const exists = await musicModel.exists({ _id: trackId });
    if (!exists) return res.status(404).json({ message: "Song not found" });

    // Remove then add at the front, so the newest like is first
    await userModel.updateOne({ _id: req.user.id }, { $pull: { likedTracks: trackId } });
    await userModel.updateOne(
        { _id: req.user.id },
        { $push: { likedTracks: { $each: [trackId], $position: 0 } } }
    );

    return res.status(200).json({ message: "Added to Liked Songs", trackId });
}

// DELETE /api/me/likes/:trackId
async function unlikeTrack(req, res) {
    const { trackId } = req.params;
    if (!isId(trackId)) return res.status(400).json({ message: "Invalid song id" });

    await userModel.updateOne({ _id: req.user.id }, { $pull: { likedTracks: trackId } });
    return res.status(200).json({ message: "Removed from Liked Songs", trackId });
}

// GET /api/me/history
async function getHistory(req, res) {
    const user = await userModel
        .findById(req.user.id)
        .select('recentlyPlayed')
        .populate({ path: 'recentlyPlayed.track', populate: TRACK_WITH_ARTIST });

    if (!user) return res.status(401).json({ message: "Unauthorized" });

    return res.status(200).json({
        message: "History fetched successfully",
        tracks: user.recentlyPlayed.map((entry) => entry.track).filter(Boolean),
    });
}

// POST /api/me/history/:trackId — called by the player after a song has played for a few seconds
async function recordPlay(req, res) {
    const { trackId } = req.params;
    if (!isId(trackId)) return res.status(400).json({ message: "Invalid song id" });

    const track = await musicModel.findByIdAndUpdate(trackId, { $inc: { plays: 1 } });
    if (!track) return res.status(404).json({ message: "Song not found" });

    await userModel.updateOne({ _id: req.user.id }, { $pull: { recentlyPlayed: { track: trackId } } });
    await userModel.updateOne(
        { _id: req.user.id },
        { $push: { recentlyPlayed: { $each: [{ track: trackId, playedAt: new Date() }], $position: 0, $slice: 30 } } }
    );

    return res.status(200).json({ message: "Play recorded", trackId });
}

module.exports = { getLikes, likeTrack, unlikeTrack, getHistory, recordPlay };
