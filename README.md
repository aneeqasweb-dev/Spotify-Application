# Beat Flow 🎵

A music streaming app: listeners stream, like and collect music into playlists; artists upload songs and
release albums.

- **Backend:** Express 5 · MongoDB (Mongoose) · JWT in an HTTP-only cookie · Multer · ImageKit
- **Frontend:** React 19 · Vite · React Router · Axios (in `frontend/`)

## Features

**For visitors**
- **Continue as guest** on the login page — try every feature without signing up (guest accounts delete themselves after 7 days)
- Login page shows a live wall of album covers from the catalogue

**Listening**
- Home: quick picks, *Jump back in*, genre mixes *Made for you*, *Beat Flow picks*, new releases, trending songs, popular artists
- Famous artists (Justin Bieber, Dua Lipa, BLACKPINK, BTS, CKay, Rema, The Weeknd…) as **official 30-second previews** with real artwork, marked *Preview*, with "Listen on Apple Music" for the full song
- Player: play/pause, next/previous, shuffle, repeat (all / one), seek, volume, full-screen *Now playing* view
- **Queue**: "Add to queue" plays songs next, then the album/playlist continues; queue side panel
- Resumes the last song where you left off; lock-screen / media-key controls with cover art
- Space bar = play/pause

**Your library**
- **Liked Songs** (heart button on every song)
- **Playlists**: create, rename, add a description and picture, add/remove songs, "Find songs" search, delete
- **Recently played** + play counts (a play counts after 10 seconds)

**Browse**
- Album, **artist** (Popular, Discography, About) and **genre mix** pages, coloured from their cover art
- Search across songs, artists, albums and playlists, with *Browse all* genre tiles
- Song menu (**…** or right-click): add to playlist / queue, like, go to artist / album, credits

**Artists (Artist Studio)**
- Upload a song — picture, title, artist, length and genre are read from the file automatically
- Create albums (optional album picture)
- Manage: edit a song's title, genre or picture; rename or delete albums; delete songs

## Run it

Open a terminal **in the project folder** (`~/COMPLETE-BACKEND/spotify-web-app` — the folder with
`package.json`) and run:

```bash
npm install      # first time only
npm start        # builds the website if needed, then starts everything
```

Open **http://localhost:3000** when you see `🎵 Beat Flow is running`. Keep the terminal open while you use
it (Ctrl + C stops it).

`.env` (project root) needs: `MONGO_URI`, `JWT_SECRET`, `IMAGEKIT_PRIVATE_KEY`.

**While coding:** `npm run dev` — same address, but the server restarts and the website rebuilds
automatically when you save a file (refresh the page to see changes).
For instant frontend hot-reload, run `npm run client` in a second terminal and open http://localhost:5173.

**Common messages**
- `Could not read package.json` → you're in the wrong folder; `cd ~/COMPLETE-BACKEND/spotify-web-app`
- `Port 3000 is already in use` → Beat Flow is already running; just open http://localhost:3000
- `Missing setting(s): …` → add the named value to `.env`

## Put it online (Render)

`localhost` only works on your own computer. To let anyone visit Beat Flow, host it:

1. **MongoDB Atlas → Network Access → Add IP Address → "Allow access from anywhere" (0.0.0.0/0).**
   Render's servers don't have a fixed IP, so Atlas must accept them.
2. Push this repo to GitHub (without `.env` — it's in `.gitignore`).
3. On [render.com](https://render.com): **New → Blueprint →** pick this repo. It reads `render.yaml`.
4. Render asks for `MONGO_URI` and `IMAGEKIT_PRIVATE_KEY` — paste them. `JWT_SECRET` is generated for you.
5. Wait for the build, then open the `https://beat-flow-xxxx.onrender.com` link. Every push to GitHub redeploys.

**Free plan:** the app sleeps after ~15 minutes with no visitors; the next visit wakes it (takes ~30–60 s).
**Always on:** change `plan: free` to `plan: starter` in `render.yaml` (paid).

## API

All routes except register/login/logout need the login cookie. The Postman collection in `postman/`
has a request for every route.

| Method | Route | Who | What |
| ------ | ----- | --- | ---- |
| POST | `/api/auth/register` | anyone | `{ username, email, password, role }` |
| POST | `/api/auth/login` | anyone | `{ username or email, password }` |
| POST | `/api/auth/logout` | anyone | clears the cookie |
| GET | `/api/auth/me` | logged in | the current user |
| POST | `/api/auth/guest` | anyone | start a temporary guest account (logged in straight away) |
| GET | `/api/public/highlights` | anyone | a few album covers + catalogue numbers for the login page |
| GET | `/api/music?limit=&skip=` | logged in | songs, newest first (max 200) |
| POST | `/api/music/upload` | artist | form-data: `music` (audio), `title`, optional `genre`, optional `cover` (image) |
| PATCH | `/api/music/:id` | artist (owner) | `{ title?, genre? }` (+ optional `cover`) |
| DELETE | `/api/music/:id` | artist (owner) | also removes it from albums, playlists and likes |
| POST | `/api/music/album` | artist | `{ title, musics: [songIds] }` (form-data + `cover` also works) |
| GET | `/api/music/albums` | logged in | all albums with their songs |
| GET | `/api/music/albums/:id` | logged in | one album |
| PATCH | `/api/music/albums/:id` | artist (owner) | `{ title? }` (+ optional `cover`) |
| DELETE | `/api/music/albums/:id` | artist (owner) | the songs stay |
| GET | `/api/me/likes` | logged in | your Liked Songs |
| PUT / DELETE | `/api/me/likes/:songId` | logged in | like / unlike |
| GET | `/api/me/history` | logged in | recently played |
| POST | `/api/me/history/:songId` | logged in | record a play (+1 play count) |
| GET | `/api/playlists` | logged in | your playlists + Beat Flow picks |
| POST | `/api/playlists` | logged in | `{ name?, description? }` (+ optional `cover`) |
| GET | `/api/playlists/:id` | logged in | one playlist |
| PATCH / DELETE | `/api/playlists/:id` | owner | edit / delete |
| POST | `/api/playlists/:id/tracks` | owner | `{ trackId }` — 409 if it's already there |
| DELETE | `/api/playlists/:id/tracks/:songId` | owner | remove a song |

## Project structure

```
src/                      Express backend
  controllers/            auth, music, me (likes & history), playlist
  middlewares/            auth (login / artist checks), upload (Multer)
  models/                 user, music, album, playlist
  routes/                 one file per area, mounted in app.js
  services/               storage (ImageKit), metadata (reads tags & cover from song files)
  utils/                  shared query helpers
scripts/                  one-off maintenance scripts
tests/                    node:test API tests (database mocked)
frontend/src/
  api/                    every API call + data shaping
  context/                Auth, Library (catalogue), Collection (likes/playlists/history), Player, Toast
  components/layout/      app shell, sidebar, top bar, route guards
  components/player/      player bar, controls, queue panel, full-screen view
  components/music/       covers, cards, song list, page headers, edit dialog
  components/menus/       song menu and credits
  components/ui/          buttons, dialogs, skeletons, empty states…
  pages/                  one file per screen
  styles/                 design system (tokens, layout, components, features…)
postman/                  Postman collection + environment
```

## Song pictures

When a song is uploaded, the server reads the info stored inside the file (title, artist, length, genre
and **cover picture**) and saves the picture to ImageKit. An artist can also send their own `cover` image.
Albums and playlists without their own picture use their songs' covers.

For songs uploaded before this existed:

```bash
npm run backfill:covers -- --dry-run   # preview, changes nothing
npm run backfill:covers                # add pictures, length and artist name
npm run backfill:covers -- --titles    # …and also use the title stored inside each file
```

## Music credits

**Famous songs** (Justin Bieber, Dua Lipa, BLACKPINK…) are **30-second previews streamed directly from Apple
Music** through Apple's public iTunes Search API, with their official artwork and a link to the full song.
They are not downloaded or re-hosted, which keeps the app safe to show publicly.

The demo catalogue (albums *Jazz*, *Medium Electronic*, *Funk and Blues*, *Disco and Lounge*,
*Latin Sounds*, *Action*) is by **Kevin MacLeod (incompetech.com)**, licensed under
[Creative Commons: By Attribution 4.0](https://creativecommons.org/licenses/by/4.0/). Each song carries
this credit, shown in the app under *Show credits*. Album and playlist artwork uses free photos from
Unsplash (via picsum.photos).

## Tests

```bash
npm test
```
