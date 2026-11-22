import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { initTheme } from './lib/theme'
import '@fontsource-variable/inter/wght.css'
import '@fontsource-variable/unbounded/wght.css'
import './index.css'

initTheme()

const root = document.getElementById('root')
if (!root) throw new Error('#root not found')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
