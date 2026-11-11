import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { applyTheme, getTheme } from './lib/theme'
import '@fontsource-variable/inter/wght.css'
import './index.css'

applyTheme(getTheme())

const root = document.getElementById('root')
if (!root) throw new Error('#root not found')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
