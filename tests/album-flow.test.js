const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const app = require('../src/app');
const users = require('../src/models/user.model');
const albums = require('../src/models/album.model');

test('album authentication and creation over HTTP', async (t) => {
  const previousSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'album-flow-test-secret';
  const artistId = '507f1f77bcf86cd799439011';
  const musicId = '507f1f77bcf86cd799439012';
  const password = await bcrypt.hash('test-password', 4);
  t.mock.method(users, 'findOne', async () => ({
    _id: artistId, username: 'artist', email: 'artist@example.test', role: 'artist', password,
  }));
  const create = t.mock.method(albums, 'create', async (data) => ({
    _id: '507f1f77bcf86cd799439013', ...data,
  }));
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    if (previousSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousSecret;
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  const post = (path, body, headers = {}) => fetch(base + path, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
  const body = { title: 'test_album_1', musics: [musicId] };
  const login = await post('/api/auth/login', { username: 'artist', password: 'test-password' });
  assert.equal(login.status, 200);
  assert.equal((await login.json()).token, undefined);
  assert.match(login.headers.get('set-cookie'), /^token=/);
  const loginCookie = login.headers.get('set-cookie').split(';')[0];
  const token = loginCookie.slice('token='.length);
  assert.equal(jwt.verify(token, process.env.JWT_SECRET).role, 'artist');

  for (const [name, headers, payload, status] of [
    ['missing token', {}, body, 401],
    ['invalid token', { Cookie: 'token=invalid' }, body, 401],
    ['expired token', { Cookie: `token=${jwt.sign({ id: artistId, role: 'artist' }, process.env.JWT_SECRET, { expiresIn: -1 })}` }, body, 401],
    ['non-artist', { Cookie: `token=${jwt.sign({ id: artistId, role: 'user' }, process.env.JWT_SECRET)}` }, body, 403],
    ['incorrect title field', { Cookie: loginCookie }, { test: 'test_album_1', musics: [musicId] }, 400],
    ['missing music IDs', { Cookie: loginCookie }, { title: 'test_album_1', musics: [] }, 400],
    ['Bearer alone is rejected', { Authorization: `Bearer ${token}` }, body, 401],
    ['cookie works despite unrelated header', { Authorization: 'Bearer stale', Cookie: loginCookie }, body, 201],
    ['login response cookie without Bearer authorization', { Cookie: loginCookie }, body, 201],
  ]) {
    await t.test(name, async () => {
      const before = create.mock.callCount();
      const response = await post('/api/music/album', payload, headers);
      assert.equal(response.status, status);
      if (status === 201) {
        const result = await response.json();
        assert.equal(result.album.title, body.title);
        assert.equal(result.album.artist, artistId);
        assert.deepEqual(result.album.musics, [musicId]);
        assert.equal(create.mock.callCount(), before + 1);
      } else {
        assert.equal(create.mock.callCount(), before);
      }
    });
  }
});
