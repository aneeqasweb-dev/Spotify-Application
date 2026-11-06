const mongoose = require('mongoose');

const playlistSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
    },
    description: {
        type: String,
        default: '',
        maxlength: 300,
    },
    // The account that made it (only they can change it)
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
    },
    tracks: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'music',
    }],
    coverUrl: {
        type: String,
        default: '',
    },
    // Set for editorial playlists made by the app (e.g. "Beat Flow"); shown to everyone
    curator: {
        type: String,
        default: '',
    },
}, { timestamps: true });

const playlistModel = mongoose.model('playlist', playlistSchema);

module.exports = playlistModel;
