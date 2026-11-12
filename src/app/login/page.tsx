import type { Metadata } from 'next'
import Link from 'next/link'
import { AuthForm } from '@/components/auth-form'
export const metadata: Metadata = { title: 'Sign in' }
export default function Login() {
  return <section className="container auth-layout"><div className="auth-story"><Link href="/" className="back-link">← Back to discovering</Link><p className="eyebrow">Your little corner of the world</p><h1>Good to<br /><em>see you again.</em></h1><p>Your next favourite find is just around the corner.</p><div className="story-symbol" aria-hidden="true">✳</div></div><div className="auth-card"><span className="small-label">WELCOME BACK</span><h2>Sign in to Erogine</h2><p className="muted">Pick up where your curiosity left off.</p><AuthForm mode="login" /></div></section>
}
