import { Route, Routes } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import { GuestOnly, RequireAuth } from './components/layout/RouteGuards'
import { MenuProvider } from './components/menus/MenuContext'
import { AuthProvider } from './context/AuthContext'
import { CollectionProvider } from './context/CollectionContext'
import { LibraryProvider } from './context/LibraryContext'
import { PlayerProvider } from './context/PlayerContext'
import { ToastProvider } from './context/ToastContext'
import AlbumPage from './pages/AlbumPage'
import ArtistPage from './pages/ArtistPage'
import AuthPage from './pages/AuthPage'
import GenrePage from './pages/GenrePage'
import HomePage from './pages/HomePage'
import LibraryPage from './pages/LibraryPage'
import LikedSongsPage from './pages/LikedSongsPage'
import MoodPage from './pages/MoodPage'
import NotFoundPage from './pages/NotFoundPage'
import PlaylistPage from './pages/PlaylistPage'
import SearchPage from './pages/SearchPage'
import StudioPage from './pages/StudioPage'

// Everything the logged-in app needs, outermost first:
// catalogue → your collection → the player → the song menu
function AppProviders({ children }) {
  return (
    <LibraryProvider>
      <CollectionProvider>
        <PlayerProvider>
          <MenuProvider>{children}</MenuProvider>
        </PlayerProvider>
      </CollectionProvider>
    </LibraryProvider>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Routes>
          <Route
            path="/login"
            element={
              <GuestOnly>
                <AuthPage key="login" mode="login" />
              </GuestOnly>
            }
          />
          <Route
            path="/register"
            element={
              <GuestOnly>
                <AuthPage key="register" mode="register" />
              </GuestOnly>
            }
          />

          {/* Everything below needs a logged-in user */}
          <Route
            element={
              <RequireAuth>
                <AppProviders>
                  <AppLayout />
                </AppProviders>
              </RequireAuth>
            }
          >
            <Route index element={<HomePage />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="library" element={<LibraryPage />} />
            <Route path="collection/tracks" element={<LikedSongsPage />} />
            <Route path="album/:albumId" element={<AlbumPage />} />
            <Route path="artist/:slug" element={<ArtistPage />} />
            <Route path="playlist/:playlistId" element={<PlaylistPage />} />
            <Route path="genre/:slug" element={<GenrePage />} />
            <Route path="mood/:slug" element={<MoodPage />} />
            <Route path="studio" element={<StudioPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </ToastProvider>
  )
}
