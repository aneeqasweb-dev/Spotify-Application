// Liked Songs, playlists and "only the owner can change it" rules, tested over HTTP with the database mocked
const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const users = require('../src/models/user.model');
const musics = require('../src/models/music.models');
const playlists = require('../src/models/playlist.model');

const ME = '507f1f77bcf86cd799439011';
const SOMEONE_ELSE = '507f1f77bcf86cd799439099';
const SONG = '507f1f77bcf86cd799439012';
const PLAYLIST = '507f1f77bcf86cd799439013';

// A fake mongoose query: can be awaited directly or chained with .populate()
function query(doc) {
    const promise = Promise.resolve(doc);
    promise.populate = () => Promise.resolve(doc);
    return promise;
}

test('library features over HTTP', async (t) => {
    const previousSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = 'library-test-secret';
    const listener = `token=${jwt.sign({ id: ME, role: 'user' }, process.env.JWT_SECRET)}`;
    const artist = `token=${jwt.sign({ id: ME, role: 'artist' }, process.env.JWT_SECRET)}`;

    const server = app.listen(0, '127.0.0.1');
    await new Promise((resolve) => server.once('listening', resolve));
    t.after(async () => {
        await new Promise((resolve) => server.close(resolve));
        if (previousSecret === undefined) delete process.env.JWT_SECRET;
        else process.env.JWT_SECRET = previousSecret;
    });

    const base = `http://127.0.0.1:${server.address().port}`;
    const call = (method, path, cookie, body) => fetch(base + path, {
        method,
        headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
        body: body ? JSON.stringify(body) : undefined,
    });

    await t.test('playlists need a login', async () => {
        assert.equal((await call('GET', '/api/playlists')).status, 401);
    });

    await t.test('liking: bad id, unknown song, then success', async () => {
        assert.equal((await call('PUT', '/api/me/likes/not-an-id', listener)).status, 400);

        const exists = t.mock.method(musics, 'exists', async () => null);
        assert.equal((await call('PUT', `/api/me/likes/${SONG}`, listener)).status, 404);

        exists.mock.mockImplementation(async () => ({ _id: SONG }));
        const update = t.mock.method(users, 'updateOne', async () => ({}));
        const res = await call('PUT', `/api/me/likes/${SONG}`, listener);
        assert.equal(res.status, 200);
        assert.equal(update.mock.callCount(), 2); // removed, then added at the front
        const pushed = update.mock.calls[1].arguments[1].$push.likedTracks;
        assert.deepEqual(pushed, { $each: [SONG], $position: 0 });

        assert.equal((await call('DELETE', `/api/me/likes/${SONG}`, listener)).status, 200);
    });

    await t.test('a new playlist gets a default name', async () => {
        t.mock.method(playlists, 'countDocuments', async () => 2);
        const create = t.mock.method(playlists, 'create', async (data) => ({ _id: PLAYLIST, ...data }));
        t.mock.method(playlists, 'findById', () => query({ _id: PLAYLIST, name: 'My Playlist #3', tracks: [] }));

        const res = await call('POST', '/api/playlists', listener, {});
        assert.equal(res.status, 201);
        assert.equal(create.mock.calls[0].arguments[0].name, 'My Playlist #3');
        assert.equal(create.mock.calls[0].arguments[0].owner, ME);
        assert.equal((await res.json()).playlist.name, 'My Playlist #3');
    });

    await t.test("you can't add songs to someone else's playlist", async () => {
        t.mock.method(playlists, 'findById', () => query({ _id: PLAYLIST, owner: SOMEONE_ELSE, tracks: [] }));
        const update = t.mock.method(playlists, 'updateOne', async () => ({}));
        const res = await call('POST', `/api/playlists/${PLAYLIST}/tracks`, listener, { trackId: SONG });
        assert.equal(res.status, 403);
        assert.equal(update.mock.callCount(), 0);

        assert.equal((await call('DELETE', `/api/playlists/${PLAYLIST}/tracks/${SONG}`, listener)).status, 403);
        assert.equal((await call('DELETE', `/api/playlists/${PLAYLIST}`, listener)).status, 403);
    });

    await t.test('adding the same song twice is refused, adding a new one works', async () => {
        t.mock.method(playlists, 'findById', () => query({ _id: PLAYLIST, owner: ME, name: 'Road trip', tracks: [SONG] }));
        assert.equal((await call('POST', `/api/playlists/${PLAYLIST}/tracks`, listener, { trackId: SONG })).status, 409);

        const other = '507f1f77bcf86cd799439014';
        t.mock.method(musics, 'exists', async () => ({ _id: other }));
        const update = t.mock.method(playlists, 'updateOne', async () => ({}));
        const res = await call('POST', `/api/playlists/${PLAYLIST}/tracks`, listener, { trackId: other });
        assert.equal(res.status, 200);
        assert.deepEqual(update.mock.calls[0].arguments[1], { $push: { tracks: other } });
    });

    await t.test('songs can only be edited or deleted by the artist who uploaded them', async () => {
        assert.equal((await call('DELETE', `/api/music/${SONG}`, listener)).status, 403); // listeners never can

        t.mock.method(musics, 'findById', async () => ({ _id: SONG, artist: SOMEONE_ELSE }));
        const remove = t.mock.method(musics, 'deleteOne', async () => ({}));
        assert.equal((await call('DELETE', `/api/music/${SONG}`, artist)).status, 403);
        assert.equal((await call('PATCH', `/api/music/${SONG}`, artist, { title: 'New name' })).status, 403);
        assert.equal(remove.mock.callCount(), 0);
    });
});
