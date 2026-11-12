import type { Metadata } from 'next'
import Link from 'next/link'
import { PasswordResetForm } from '@/components/password-reset-form'

export const metadata: Metadata = { title: 'Choose a new password', robots: { index: false, follow: false }, referrer: 'no-referrer' }
export const dynamic = 'force-dynamic'

export default function ResetPassword() {
  return <section className="container auth-layout"><div className="auth-story"><Link href="/login" className="back-link">← Back to sign in</Link><p className="eyebrow">Your little corner of the world</p><h1>A fresh<br /><em>start.</em></h1><p>Choose a new password for your Erogine account.</p><div className="story-symbol" aria-hidden="true">✳</div></div><div className="auth-card"><span className="small-label">WELCOME BACK</span><h2>Choose a new password</h2><p className="muted">Your account and orders stay with you.</p><PasswordResetForm /></div></section>
}
