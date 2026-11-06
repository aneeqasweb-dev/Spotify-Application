const { ImageKit } = require('@imagekit/nodejs');

// Create the ImageKit client on the first upload, not when this file is
// imported. That way the app (and the tests) can start even if
// IMAGEKIT_PRIVATE_KEY isn't loaded yet.
let imagekit = null;

function getClient() {
    if (!imagekit) {
        imagekit = new ImageKit({
            privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
        });
    }
    return imagekit;
}

// file: base64 string. Songs go to backend/music, cover pictures to backend/covers.
async function uploadFile(file, { folder = "backend/music", fileName = "music_" + Date.now() } = {}) {
    const result = await getClient().files.upload({
        file,
        fileName,
        folder
    });
    return result;
}

async function uploadCover(buffer) {
    return uploadFile(buffer.toString('base64'), {
        folder: "backend/covers",
        fileName: "cover_" + Date.now(),
    });
}

module.exports = { uploadFile, uploadCover }
