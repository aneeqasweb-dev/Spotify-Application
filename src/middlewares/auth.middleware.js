const jwt = require("jsonwebtoken");

// Reads the JWT from the "token" cookie and checks it.
// Returns the decoded payload, or sends a 401 and returns null.
function verifyToken(req, res) {
    const token = req.cookies && req.cookies.token;

    if (!token) {
        res.status(401).json({ message: "Unauthorized" });
        return null;
    }

    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        // Invalid or expired token -> the user must log in again
        res.status(401).json({ message: "Session expired, please log in again" });
        return null;
    }
}

// Only artists can upload music and create albums
function authArtist(req, res, next) {
    const decoded = verifyToken(req, res);
    if (!decoded) return;

    if (decoded.role !== "artist") {
        return res.status(403).json({ message: "you don't have access to create music" });
    }

    req.user = decoded;
    next();
}

// Any logged-in account (listener or artist) can browse and play music
function authUser(req, res, next) {
    const decoded = verifyToken(req, res);
    if (!decoded) return;

    if (decoded.role !== "user" && decoded.role !== "artist") {
        return res.status(403).json({ message: "you don't have access to this route" });
    }

    req.user = decoded;
    next();
}

module.exports = { authArtist, authUser };
