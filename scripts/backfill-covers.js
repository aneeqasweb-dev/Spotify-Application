// One-time helper: give songs uploaded before covers existed their picture, length
// and artist name, read from inside each audio file.
//
//   npm run backfill:covers -- --dry-run     show what would change, change nothing
//   npm run backfill:covers                  update the songs
//   npm run backfill:covers -- --titles      also replace titles with the title inside the file

require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');
const musicModel = require('../src/models/music.models');
const { uploadCover } = require('../src/services/storage.service');
const { readAudioMetadata } = require('../src/services/metadata.service');

const dryRun = process.argv.includes('--dry-run');
const useTitles = process.argv.includes('--titles');

async function main() {
    await mongoose.connect(process.env.MONGO_URI);

    const tracks = await musicModel.find({
        $or: [{ coverUrl: { $exists: false } }, { coverUrl: '' }, { duration: { $exists: false } }],
    });
    console.log(`${tracks.length} track(s) need info${dryRun ? ' (dry run — nothing will be saved)' : ''}\n`);

    for (const track of tracks) {
        try {
            const response = await fetch(track.uri);
            if (!response.ok) throw new Error(`download failed (HTTP ${response.status})`);
            const buffer = Buffer.from(await response.arrayBuffer());
            const meta = await readAudioMetadata(buffer, response.headers.get('content-type') || 'audio/mpeg');

            const update = {};
            if (meta.duration) update.duration = meta.duration;
            if (meta.artist && !track.artistName) update.artistName = meta.artist;
            if (useTitles && meta.title && meta.title !== track.title) update.title = meta.title;

            const hasPicture = Boolean(meta.picture) && !track.coverUrl;
            if (hasPicture && !dryRun) update.coverUrl = (await uploadCover(meta.picture.data)).url;

            console.log(`• "${track.title}"`);
            if (update.title) console.log(`    title   → "${update.title}"`);
            if (update.artistName) console.log(`    artist  → ${update.artistName}`);
            if (update.duration) console.log(`    length  → ${Math.round(update.duration)} s`);
            console.log(`    picture → ${hasPicture ? (dryRun ? 'found inside the file' : update.coverUrl) : 'none'}`);

            if (!dryRun && Object.keys(update).length) {
                await musicModel.updateOne({ _id: track._id }, { $set: update });
            }
        } catch (err) {
            console.log(`• "${track.title}" — skipped: ${err.message}`);
        }
    }

    await mongoose.disconnect();
    console.log(dryRun ? '\nDry run finished.' : '\nDone.');
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
