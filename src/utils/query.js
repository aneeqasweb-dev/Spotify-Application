// Shared helpers for controllers

const mongoose = require('mongoose');

// Only these user fields are ever sent with songs/albums/playlists (never the password hash)
const PUBLIC_USER_FIELDS = 'username';

// populate() option: a song together with its uploader's username
const TRACK_WITH_ARTIST = { path: 'artist', select: PUBLIC_USER_FIELDS };

const isId = (value) => mongoose.isValidObjectId(value);

// Works whether `owner` is an id or a populated user document
function isOwner(doc, userId, field = 'owner') {
    const owner = doc && doc[field];
    if (!owner) return false;
    return String(owner._id || owner) === String(userId);
}

module.exports = { PUBLIC_USER_FIELDS, TRACK_WITH_ARTIST, isId, isOwner };
