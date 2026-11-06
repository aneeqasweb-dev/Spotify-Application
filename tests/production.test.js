// Production behaviour: health check, security headers, compression, login rate limiting, 404s
const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/app');
const users = require('../src/models/user.model');

test('production safeguards over HTTP', async (t) => {
    const server = app.listen(0, '127.0.0.1');
    await new Promise((resolve) => server.once('listening', resolve));
    t.after(() => new Promise((resolve) => server.close(resolve)));
    const base = `http://127.0.0.1:${server.address().port}`;

    await t.test('health check answers', async () => {
        const res = await fetch(`${base}/api/health`);
        assert.equal(res.status, 200);
        assert.deepEqual(await res.json(), { status: 'ok' });
    });

    await t.test('security headers are set and Express is not advertised', async () => {
        const res = await fetch(`${base}/api/health`);
        assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
        assert.equal(res.headers.get('x-frame-options'), 'DENY');
        assert.equal(res.headers.get('x-powered-by'), null);
    });

    await t.test('unknown API routes and missing files give a clean 404', async () => {
        const api = await fetch(`${base}/api/does-not-exist`);
        assert.equal(api.status, 404);
        assert.equal((await api.json()).message, 'Route not found');
        const asset = await fetch(`${base}/assets/missing-file.js`);
        assert.equal(asset.status, 404);
    });

    await t.test('website pages are served (or a clear message if not built yet)', async () => {
        const res = await fetch(`${base}/album/anything`);
        assert.ok([200, 503].includes(res.status));
        assert.match(res.headers.get('content-type'), /text\/html/);
    });

    await t.test('large responses are gzip-compressed', async () => {
        const res = await fetch(`${base}/album/anything`, { headers: { 'Accept-Encoding': 'gzip' } });
        if (res.status === 200 && Number(res.headers.get('content-length') || 2000) > 1024) {
            assert.equal(res.headers.get('content-encoding'), 'gzip');
        }
    });

    await t.test('too many login attempts are blocked (429)', async () => {
        t.mock.method(users, 'findOne', async () => null); // every attempt is a wrong password
        const attempt = () => fetch(`${base}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'someone', password: 'guess' }),
        });
        for (let i = 0; i < 20; i++) assert.equal((await attempt()).status, 401);
        const blocked = await attempt();
        assert.equal(blocked.status, 429);
        assert.ok(Number(blocked.headers.get('retry-after')) > 0);
    });
});
