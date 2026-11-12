'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
export function SignOut() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function logout() {
    setBusy(true)
    setError('')
    try {
      const csrfResponse = await fetch('/api/auth/csrf', { cache: 'no-store' })
      const csrf = await csrfResponse.json()
      const response = await fetch('/api/auth/logout', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-erogine-client': 'web', 'x-csrf-token': csrf.csrfToken || '' }, body: '{}' })
      if (!response.ok) throw new Error('Unable to sign out. Please try again.')
      router.replace('/')
      router.refresh()
    } catch (problem) { setError(problem instanceof Error ? problem.message : 'Please try again.') }
    finally { setBusy(false) }
  }
  return <div><button className="button secondary" onClick={logout} disabled={busy}>{busy ? 'Signing out…' : 'Sign out'}</button>{error && <p className="error-message" role="alert">{error}</p>}</div>
}
