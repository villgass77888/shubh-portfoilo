import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/globals.css'
import { legacyHash, normalizePath } from './seo/paths'

const root = document.getElementById('root')!
const path = normalizePath(window.location.pathname)
const moved = path === '/' ? legacyHash(window.location.hash) : null

if (moved) {
  // old hash links (#archive/srj, #packaging/croppd-honey) now have real pages
  window.location.replace(moved)
} else if (path === '/') {
  void import('./App').then(({ default: App }) => {
    // the prerendered markup is replaced by the live page in one commit
    createRoot(root).render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  })
} else {
  if (path !== window.location.pathname) history.replaceState(history.state, '', path + window.location.search)
  void import('./pages/boot').then(({ mount }) => mount(root, path))
}
