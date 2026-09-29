const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

const { getTokenFromRequest, createAlbum } = require('../src/controllers/music.controller');

test('ignores Authorization bearer header', () => {
  const req = {
    headers: {
      authorization: 'Bearer test-token-123',
    },
    cookies: {},
  };

  assert.equal(getTokenFromRequest(req), null);
});

test('reads JWT from cookie when present', () => {
  const req = {
    headers: {},
    cookies: {
      token: 'cookie-token-456',
    },
  };

  assert.equal(getTokenFromRequest(req), 'cookie-token-456');
});

test('returns null when no auth token is provided', () => {
  const req = {
    headers: {},
    cookies: {},
  };

  assert.equal(getTokenFromRequest(req), null);
});

test('createAlbum returns 400 when title is missing', async () => {
  process.env.JWT_SECRET = 'test-secret';
  const validToken = jwt.sign({ id: '507f1f77bcf86cd799439011', role: 'artist' }, process.env.JWT_SECRET);

  const req = {
    headers: {},
    cookies: { token: validToken },
    body: {
      musics: ['507f1f77bcf86cd799439012'],
    },
  };

  const res = {
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    },
  };

  await createAlbum(req, res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.payload.message, 'Album title is required');
});
