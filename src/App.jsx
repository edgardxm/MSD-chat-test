import { useRef, useState } from 'react'
import { createInfobipJwt, WIDGET_ID } from './infobipAuth.js'

const MIN_DIGITS = 3

export default function App() {
  const [mdmId, setMdmId] = useState('')
  const [banner, setBanner] = useState(null) // { type: 'success' | 'error', text }
  const [authenticating, setAuthenticating] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)
  const initializedRef = useRef(false)

  function handleChange(event) {
    // Aceita apenas dígitos
    setMdmId(event.target.value.replace(/\D/g, ''))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (authenticated) return

    const value = mdmId.trim()
    if (value.length < MIN_DIGITS) return

    setAuthenticating(true)
    setBanner(null)
    try {
      const token = await createInfobipJwt(value)

      if (typeof window.liveChat !== 'function') {
        setBanner({ type: 'error', text: 'Widget liveChat não encontrado.' })
        return
      }

      // Inicializa o chat apenas na primeira autenticação.
      if (!initializedRef.current) {
        window.liveChat('init', WIDGET_ID)
        initializedRef.current = true
      }

      window.liveChat('auth', token)
      setAuthenticated(true)
      setBanner({ type: 'success', text: `Chat autenticado com mdmId ${value}.` })
    } catch (err) {
      console.error('Falha ao autenticar no Live Chat:', err)
      setBanner({ type: 'error', text: 'Falha na autenticação (veja o console).' })
    } finally {
      setAuthenticating(false)
    }
  }

  const canSubmit = !authenticated && !authenticating && mdmId.length >= MIN_DIGITS

  return (
    <>
      {banner && (
        <div className={`banner banner--${banner.type}`} role="status">
          {banner.text}
        </div>
      )}

      <main className="home">
        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="mdmId">mdmId</label>
          <div className="auth-form__row">
            <input
              id="mdmId"
              type="text"
              value={mdmId}
              onChange={handleChange}
              inputMode="numeric"
              autoComplete="off"
              placeholder="Digite o mdmId"
              disabled={authenticated}
            />
            <button type="submit" disabled={!canSubmit}>
              {authenticating ? 'Enviando...' : 'Enviar'}
            </button>
          </div>
          <p className="auth-form__hint">
            {authenticated
              ? 'Autenticado. Para usar outro mdmId, abra uma nova sessão do navegador (nova aba anônima ou outro navegador).'
              : `O chat só será autenticado ao clicar em Enviar (mínimo ${MIN_DIGITS} dígitos).`}
          </p>
        </form>
      </main>
    </>
  )
}
