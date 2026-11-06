const multer = require('multer');

// Files are kept in memory, then sent on to ImageKit by the controllers.
// "music" must be audio and "cover" must be an image; anything else is skipped
// (the controller then replies with a clear 400 if something required is missing).
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB per file
    fileFilter: (req, file, cb) => {
        if (file.fieldname === 'cover') return cb(null, file.mimetype.startsWith('image/'));
        cb(null, file.mimetype.startsWith('audio/'));
    },
});

module.exports = upload;
