import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import '@fontsource-variable/source-serif-4/standard.css'
import '@fontsource-variable/ibm-plex-sans/wght.css'
import '@fontsource/ibm-plex-mono/400.css'
import '@fontsource/ibm-plex-mono/500.css'
import './styles.css'

const container = document.getElementById('root')
if (!container) {
  throw new Error('Không tìm thấy phần tử #root.')
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
