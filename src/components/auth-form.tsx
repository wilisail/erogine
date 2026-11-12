'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'

export function AuthForm({ mode, next = '/account' }: { mode: 'login' | 'register'; next?: '/account' | '/checkout' | '/shop' }) {
  const router = useRouter()
  const registering = mode === 'register'
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    const form = new FormData(event.currentTarget)
    setBusy(true)
    setError('')
    try {
      const body = { email: form.get('email'), password: form.get('password'), ...(registering ? { name: form.get('name') } : {}) }
      const response = await fetch(`/api/auth/${mode}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-erogine-client': 'web' }, body: JSON.stringify(body) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Please try again shortly.')
      router.replace(next)
      router.refresh()
    } catch (problem) { setError(problem instanceof Error ? problem.message : 'Unable to connect. Please try again.') }
    finally { setBusy(false) }
  }
  return <form onSubmit={submit} className="auth-form">
    {registering && <label>Your name<input name="name" autoComplete="name" minLength={2} maxLength={100} required placeholder="Alex Morgan" /></label>}
    <label>Email address<input name="email" type="email" autoComplete="email" maxLength={254} required placeholder="you@example.com" /></label>
    <label>Password<input name="password" type="password" autoComplete={registering ? 'new-password' : 'current-password'} minLength={registering ? 15 : 1} maxLength={128} required aria-describedby={registering ? 'password-help' : undefined} /></label>
    {registering && <p className="field-note" id="password-help">Use at least 15 characters. A short passphrase works well.</p>}
    {error && <p className="error-message" role="alert">{error}</p>}
    <button className="button primary full" type="submit" disabled={busy}>{busy ? 'One moment…' : registering ? 'Create your account' : 'Sign in'}<span aria-hidden="true">→</span></button>
    <p className="auth-switch">{registering ? 'Already part of the club? ' : 'New to Erogine? '}<Link href={(registering ? '/login' : '/register') + (next === '/account' ? '' : '?next=' + next)}>{registering ? 'Sign in' : 'Create an account'}</Link></p>
  </form>
}
