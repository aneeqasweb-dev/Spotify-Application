// Public, read-only data for the login page (no account needed)
const musicModel = require('../models/music.models');

// GET /api/public/highlights — a few album covers and catalogue numbers
async function getHighlights(req, res) {
    const tracks = await musicModel
        .find({ coverUrl: { $ne: '' } })
        .sort({ isPreview: -1, _id: -1 })
        .limit(80)
        .select('coverUrl');

    const covers = [...new Set(tracks.map((t) => t.coverUrl))].slice(0, 12);
    const [songs, artistNames] = await Promise.all([
        musicModel.countDocuments(),
        musicModel.distinct('artistName'),
    ]);

    res.set('Cache-Control', 'public, max-age=300');
    return res.status(200).json({ covers, songs, artists: artistNames.filter(Boolean).length });
}

module.exports = { getHighlights };
