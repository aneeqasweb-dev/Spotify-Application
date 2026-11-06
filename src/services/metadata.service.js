// Reads the information stored inside an audio file (ID3 tags in MP3s, etc.):
// title, artist, length and the embedded cover picture.

async function readAudioMetadata(buffer, mimeType) {
    try {
        // music-metadata is an ES module, so it's loaded with import() from CommonJS
        const { parseBuffer } = await import('music-metadata');
        const meta = await parseBuffer(buffer, { mimeType, size: buffer.length });
        const picture = meta.common.picture && meta.common.picture[0];

        return {
            title: meta.common.title ? meta.common.title.trim() : '',
            artist: meta.common.artist ? meta.common.artist.trim() : '',
            duration: Number.isFinite(meta.format.duration) ? Math.round(meta.format.duration * 10) / 10 : undefined,
            genre: meta.common.genre && meta.common.genre[0] ? String(meta.common.genre[0]).trim().slice(0, 40) : '',
            picture: picture ? { data: Buffer.from(picture.data), format: picture.format } : null,
        };
    } catch (err) {
        // A file without tags (or an unusual format) is fine — we just don't get extra info
        console.warn('Could not read audio metadata:', err.message);
        return { title: '', artist: '', duration: undefined, genre: '', picture: null };
    }
}

module.exports = { readAudioMetadata };
