const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({

    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['user', 'artist'],
        default: 'user',
    },
    // "Liked Songs" — newest like first
    likedTracks: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'music',
    }],
    // "Recently played" — newest first, capped at 30 entries
    recentlyPlayed: [{
        _id: false,
        track: { type: mongoose.Schema.Types.ObjectId, ref: 'music' },
        playedAt: { type: Date, default: Date.now },
    }],
    // Guest accounts ("Continue as guest") are deleted automatically by MongoDB after expiresAt
    isGuest: {
        type: Boolean,
        default: false,
    },
    expiresAt: {
        type: Date,
        expires: 0, // TTL index: MongoDB removes the user once this date has passed
    },
})
const userModel = mongoose.model("user", userSchema);

module.exports = userModel;
