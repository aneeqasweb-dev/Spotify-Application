// "Continue as guest" and the public highlights used by the login page
const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const users = require('../src/models/user.model');
const musics = require('../src/models/music.models');

test('guest sessions and public highlights over HTTP', async (t) => {
    const previousSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = 'guest-test-secret';
    const server = app.listen(0, '127.0.0.1');
    await new Promise((resolve) => server.once('listening', resolve));
    t.after(async () => {
        await new Promise((resolve) => server.close(resolve));
        if (previousSecret === undefined) delete process.env.JWT_SECRET;
        else process.env.JWT_SECRET = previousSecret;
    });
    const base = `http://127.0.0.1:${server.address().port}`;

    await t.test('a guest gets a temporary listener account and is logged in', async () => {
        let calls = 0;
        const create = t.mock.method(users, 'create', async (data) => {
            calls++;
            if (calls === 1) throw Object.assign(new Error('duplicate'), { code: 11000 }); // name taken → retry
            return { _id: '507f1f77bcf86cd799439011', ...data };
        });
        const res = await fetch(`${base}/api/auth/guest`, { method: 'POST' });
        assert.equal(res.status, 201);
        const { user } = await res.json();
        assert.equal(user.isGuest, true);
        assert.equal(user.role, 'user');
        assert.match(user.username, /^Guest\d{5}$/);
        assert.equal(create.mock.callCount(), 2);

        const saved = create.mock.calls[1].arguments[0];
        const days = (saved.expiresAt - Date.now()) / 86400000;
        assert.ok(days > 6.9 && days < 7.1, 'guest account expires in 7 days');

        const cookie = res.headers.get('set-cookie');
        assert.match(cookie, /^token=/);
        assert.match(cookie, /HttpOnly/i);
        const token = cookie.split(';')[0].slice('token='.length);
        assert.equal(jwt.verify(token, process.env.JWT_SECRET).role, 'user');
    });

    await t.test('highlights are public and never expose private data', async () => {
        const fakeQuery = { sort: () => fakeQuery, limit: () => fakeQuery, select: async () => [
            { coverUrl: 'https://img/a.jpg' }, { coverUrl: 'https://img/a.jpg' }, { coverUrl: 'https://img/b.jpg' },
        ] };
        t.mock.method(musics, 'find', () => fakeQuery);
        t.mock.method(musics, 'countDocuments', async () => 42);
        t.mock.method(musics, 'distinct', async () => ['Dua Lipa', 'BLACKPINK', '']);

        const res = await fetch(`${base}/api/public/highlights`); // no cookie
        assert.equal(res.status, 200);
        assert.deepEqual(await res.json(), { covers: ['https://img/a.jpg', 'https://img/b.jpg'], songs: 42, artists: 2 });
    });
});
