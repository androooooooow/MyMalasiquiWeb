import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './components/ThemeProvider.jsx'
import './styles/minimal.css'

createRoot(document.getElementById('root')).render(
  <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || 'google-oauth-not-configured'}>
    <ThemeProvider><App /></ThemeProvider>
  </GoogleOAuthProvider>,
)
