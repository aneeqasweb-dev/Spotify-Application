const path = require('path');
const fs = require('fs');
const express = require("express");
const compression = require('compression');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const authRoutes = require('./routes/auth.routes');
const musicRoutes = require('./routes/music.routes');
const meRoutes = require('./routes/me.routes');
const playlistRoutes = require('./routes/playlist.routes');
const publicRoutes = require('./routes/public.routes');
const { securityHeaders, rateLimit } = require('./middlewares/security.middleware');


const app = express();
app.set('trust proxy', 1); // hosts like Render sit behind a proxy that handles HTTPS
app.disable('x-powered-by'); // don't advertise that we use Express

app.use(securityHeaders);
app.use(compression()); // gzip responses (the app's JavaScript is ~3x smaller)
app.use(express.json());
app.use(cookieParser());

// Lets the hosting service check that the app is alive
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: "ok" });
});

// Slow down password guessing: 20 login tries and 10 sign-ups per 15 minutes per visitor
const FIFTEEN_MINUTES = 15 * 60 * 1000;
app.use('/api/auth/login', rateLimit({ windowMs: FIFTEEN_MINUTES, max: 20, message: "Too many login attempts. Please wait a few minutes and try again." }));
app.use('/api/auth/register', rateLimit({ windowMs: FIFTEEN_MINUTES, max: 10, message: "Too many sign-ups from this network. Please try again later." }));
app.use('/api/auth/guest', rateLimit({ windowMs: FIFTEEN_MINUTES, max: 10, message: "Too many guest sessions from this network. Please try again later." }));

app.use('/api/auth', authRoutes);
app.use('/api/music', musicRoutes);
app.use('/api/me', meRoutes);
app.use('/api/playlists', playlistRoutes);
app.use('/api/public', publicRoutes);

// Unknown API route -> JSON 404
app.use('/api', (req, res) => {
    res.status(404).json({ message: "Route not found" });
});

// Serve the built Beat Flow frontend from the same server,
// so the browser and API share one origin and the auth cookie just works.
const clientDist = path.join(__dirname, '..', 'frontend', 'dist');
const indexHtml = path.join(clientDist, 'index.html');

// Files in /assets have a content hash in their name, so browsers may cache them for a year
app.use('/assets', express.static(path.join(clientDist, 'assets'), { immutable: true, maxAge: '1y', fallthrough: false }));
app.use(express.static(clientDist, { index: false }));

// Every other page (/, /album/123, /search…) is handled by the React app
app.get(/^\/(?!api\/).*/, (req, res) => {
    if (!fs.existsSync(indexHtml)) {
        return res
            .status(503)
            .type('html')
            .send('<h1 style="font-family:sans-serif">Beat Flow is starting…</h1><p style="font-family:sans-serif">The website hasn’t been built yet. Run <code>npm run build</code> (or just <code>npm start</code>, which builds it for you) and refresh this page.</p>');
    }
    res.setHeader('Cache-Control', 'no-cache'); // always get the latest version of the page
    res.sendFile(indexHtml);
});

// Errors thrown in any route end up here (Express 5 forwards async errors automatically)
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        const message = err.code === 'LIMIT_FILE_SIZE' ? "File is too large (max 25 MB)" : err.message;
        return res.status(400).json({ message });
    }
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ message: "Invalid JSON body" });
    }
    if (err.status === 404 || err.statusCode === 404) {
        return res.status(404).json({ message: "Not found" }); // e.g. a missing file in /assets
    }

    console.error(err);
    res.status(500).json({ message: "Something went wrong, please try again" });
});

module.exports = app;
