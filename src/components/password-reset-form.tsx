'use client'

import Link from 'next/link'
import { useEffect, useState, type FormEvent } from 'react'

export function PasswordResetForm() {
  const [token, setToken] = useState<string | null>(null)
  const [showPasswords, setShowPasswords] = useState(false)
  const [busy, setBusy] = useState(false)
  const [complete, setComplete] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const value = new URLSearchParams(window.location.hash.slice(1)).get('token')
    if (value) {
      setToken(value)
      window.history.replaceState(null, '', window.location.pathname)
    } else setToken(current => current ?? '')
  }, [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy || !token) return
    const form = new FormData(event.currentTarget)
    const password = String(form.get('password') ?? '')
    const confirmPassword = String(form.get('confirmPassword') ?? '')
    if (password !== confirmPassword) { setError('The two passwords must match.'); return }
    setBusy(true)
    setError('')
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-erogine-client': 'web' },
        body: JSON.stringify({ token, password, confirmPassword }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Please try again shortly.')
      setToken('')
      setComplete(true)
    } catch (problem) { setError(problem instanceof Error ? problem.message : 'Unable to connect. Please try again.') }
    finally { setBusy(false) }
  }

  if (complete) return <div role="status"><p>Your password is updated. Sign in with your new password to continue.</p><Link href="/login" className="button primary full">Sign in to Erogine<span aria-hidden="true">→</span></Link></div>
  if (token === null) return <p role="status">Opening your reset link…</p>
  if (!token) return <p role="alert">This reset link is incomplete. Open the full link again.</p>

  return <form onSubmit={submit} className="auth-form">
    <label htmlFor="new-password">New password<input id="new-password" name="password" type={showPasswords ? 'text' : 'password'} autoComplete="new-password" minLength={15} maxLength={128} required aria-describedby="reset-password-help" /></label>
    <p className="field-note" id="reset-password-help">Use at least 15 characters. A short passphrase works well.</p>
    <label htmlFor="confirm-password">Confirm new password<input id="confirm-password" name="confirmPassword" type={showPasswords ? 'text' : 'password'} autoComplete="new-password" minLength={15} maxLength={128} required /></label>
    <button type="button" className="button secondary" aria-pressed={showPasswords} onClick={() => setShowPasswords(current => !current)}>{showPasswords ? 'Hide passwords' : 'Show passwords'}</button>
    {error && <p className="error-message" role="alert">{error}</p>}
    <button type="submit" className="button primary full" disabled={busy}>{busy ? 'Updating…' : 'Save new password'}<span aria-hidden="true">→</span></button>
  </form>
}
