import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './auth/AuthProvider.jsx'
import { isSupabaseConfigured } from './lib/supabase'
import { I18nProvider } from './i18n/I18nProvider.jsx'
import { migrateLegacyUrl } from './routes'

// Old ?page=… links (e.g. on Trello cards) become paths before anything renders.
migrateLegacyUrl()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <I18nProvider>
      {isSupabaseConfigured ? (
        <AuthProvider>
          <App />
        </AuthProvider>
      ) : (
        <App />
      )}
    </I18nProvider>
  </StrictMode>,
)
