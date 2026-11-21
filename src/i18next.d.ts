import 'i18next'

import type uz from './locales/uz.json'

// Translation keys are checked at compile time against the Uzbek file (the source language).
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation'
    resources: { translation: typeof uz }
  }
}
