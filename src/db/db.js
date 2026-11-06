const mongoose = require('mongoose');

async function connectDB() {

    if (!process.env.MONGO_URI) {
        console.error('MONGO_URI is missing. Add it to .env (locally) or to your hosting environment variables.');
        process.exit(1);
    }

    try {
        await mongoose.connect(process.env.MONGO_URI)
        console.log('MongoDB connected successfully');
    }
    catch (error) {
        // Without a database every request would hang, so stop here with a clear message.
        // (On a host like Render the app is restarted automatically.)
        console.error('Error connecting to MongoDB:', error.message);
        console.error('Check MONGO_URI, and that MongoDB Atlas > Network Access allows this server\'s IP.');
        process.exit(1);
    }
}

module.exports = connectDB;
