const apiUrl = import.meta.env.VITE_API_URL

if (!apiUrl) {
  throw new Error('VITE_API_URL is not set. Copy .env.example to .env.')
}

export const env = {
  apiUrl: apiUrl.replace(/\/+$/, ''),
  demoMode: import.meta.env.VITE_DEMO_MODE === 'true',
} as const
