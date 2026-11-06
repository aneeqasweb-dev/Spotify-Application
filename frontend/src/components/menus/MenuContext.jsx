import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import CreditsModal from './CreditsModal'
import TrackMenu from './TrackMenu'

const MenuContext = createContext(null)

// One song menu for the whole app ("…" button or right-click on a song)
export function MenuProvider({ children }) {
  const [menu, setMenu] = useState(null)
  const [creditsFor, setCreditsFor] = useState(null)

  const openTrackMenu = useCallback((event, track, options = {}) => {
    event.preventDefault()
    event.stopPropagation()
    const fromButton = event.type !== 'contextmenu'
    const rect = fromButton ? event.currentTarget.getBoundingClientRect() : null
    setMenu({
      key: Date.now(),
      x: fromButton ? rect.right : event.clientX,
      y: fromButton ? rect.bottom + 4 : event.clientY,
      alignRight: fromButton,
      track,
      options,
    })
  }, [])

  const close = useCallback(() => setMenu(null), [])
  const closeCredits = useCallback(() => setCreditsFor(null), [])
  const value = useMemo(() => ({ openTrackMenu, close }), [openTrackMenu, close])

  return (
    <MenuContext.Provider value={value}>
      {children}
      {menu && <TrackMenu {...menu} onClose={close} onShowCredits={setCreditsFor} />}
      {creditsFor && <CreditsModal track={creditsFor} onClose={closeCredits} />}
    </MenuContext.Provider>
  )
}

export function useMenu() {
  return useContext(MenuContext)
}
