const mongoose = require('mongoose');


const albumSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    musics: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'music',
    }],
    artist: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
    },
    // Optional album picture. If empty, the app builds one from the tracks' covers.
    coverUrl: {
        type: String,
        default: '',
    }
});
const albumModel = mongoose.model('album', albumSchema);

module.exports = albumModel;
