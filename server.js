require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');
const app = require('./src/app');
const connectDB = require('./src/db/db');

const PORT = Number(process.env.PORT) || 3000;

// Stop early with a clear message if the settings in .env are missing
function checkSettings() {
    const missing = ['MONGO_URI', 'JWT_SECRET'].filter((key) => !process.env[key]);
    if (missing.length) {
        console.error(`\n✖ Missing setting(s): ${missing.join(', ')}`);
        console.error('  Add them to the .env file in the project folder (or to your hosting dashboard).\n');
        process.exit(1);
    }
    if (!process.env.IMAGEKIT_PRIVATE_KEY) {
        console.warn('⚠ IMAGEKIT_PRIVATE_KEY is not set — uploading songs and pictures will not work.');
    }
}

async function start() {
    checkSettings();
    await connectDB(); // exits with a clear message if MongoDB can't be reached

    const server = app.listen(PORT, () => {
        console.log(`\n🎵 Beat Flow is running → http://localhost:${PORT}\n`);
    });

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.error(`\n✖ Port ${PORT} is already in use.`);
            console.error(`  Beat Flow is probably already running — open http://localhost:${PORT}`);
            console.error('  Or stop the other copy (Ctrl + C in its terminal) and try again.\n');
        } else {
            console.error(err);
        }
        process.exit(1);
    });

    // Shut down cleanly when stopped (Ctrl + C) or when the host restarts the app
    const shutdown = (signal) => {
        console.log(`\n${signal} received — shutting down Beat Flow…`);
        server.close(() => {
            mongoose.connection.close().finally(() => process.exit(0));
        });
        setTimeout(() => process.exit(0), 5000).unref();
    };
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start();
