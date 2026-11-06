const mongoose = require('mongoose');



const musicSchema = new mongoose.Schema({
    uri: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    // The account that uploaded the track
    artist: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    // Cover picture (from the MP3 itself, or uploaded by the artist)
    coverUrl: {
        type: String,
        default: ''
    },
    // Length in seconds, read from the file when it's uploaded
    duration: {
        type: Number
    },
    // Artist name written inside the file, e.g. "Tame Impala" (shown instead of the uploader's username)
    artistName: {
        type: String,
        default: ''
    },
    // e.g. "Jazz", "Electronica" — powers Browse and the genre mixes
    genre: {
        type: String,
        default: ''
    },
    // How many times the song has been played (for "Popular")
    plays: {
        type: Number,
        default: 0
    },
    // Licence / attribution text, shown under "Credits"
    credits: {
        type: String,
        default: ''
    },
    // true for official 30-second previews streamed from Apple Music (not hosted by us)
    isPreview: {
        type: Boolean,
        default: false
    },
    // Where to hear the full song (e.g. the Apple Music page)
    externalUrl: {
        type: String,
        default: ''
    },
    // The real album / single the song comes from
    albumName: {
        type: String,
        default: ''
    },
    releaseYear: {
        type: Number
    }

})

const musicModel = mongoose.model("music", musicSchema);


module.exports = musicModel;
