import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './auth/AuthProvider.jsx'
import { isSupabaseConfigured } from './lib/supabase'
import { I18nProvider } from './i18n/I18nProvider.jsx'
import { PrefsProvider } from './prefs/PrefsProvider.jsx'
import { migrateLegacyUrl } from './routes'
import { IconContext } from '@phosphor-icons/react'
import { watchForNewVersion } from './lib/freshness'
import { consumeEmailLink } from './auth/emailLink'

// Old ?page=… links (e.g. on Trello cards) become paths before anything renders.
migrateLegacyUrl()
// A tab left open across a deploy picks up the new version on the next page change.
watchForNewVersion()

// A login link from the e-mail (?token_hash=…) signs in first, so the app opens
// on the right page instead of flashing the login screen.
consumeEmailLink().finally(render)

function render() {
createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* Phosphor icons scale with the surrounding text */}
    <IconContext.Provider value={{ size: '1.15em', weight: 'regular' }}>
    <PrefsProvider>
    <I18nProvider>
      {isSupabaseConfigured ? (
        <AuthProvider>
          <App />
        </AuthProvider>
      ) : (
        <App />
      )}
    </I18nProvider>
    </PrefsProvider>
    </IconContext.Provider>
  </StrictMode>,
)
}
