import type { Metadata } from 'next'
import Link from 'next/link'
import { AuthForm } from '@/components/auth-form'
export const metadata: Metadata = { title: 'Create an account' }
export default async function Register({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const value = (await searchParams).next
  const next = value === '/checkout' || value === '/shop' ? value : '/account'
  return <section className="container auth-layout"><div className="auth-story"><Link href="/" className="back-link">← Back to discovering</Link><p className="eyebrow">A place for your kind of curious</p><h1>A little hello.<br /><em>A fresh start.</em></h1><p>Make yourself at home. We’re happy you found us.</p><div className="story-symbol" aria-hidden="true">✳</div></div><div className="auth-card"><span className="small-label">COME ON IN</span><h2>Create your account</h2><p className="muted">Just a few details, and you’re one of us.</p><AuthForm mode="register" next={next} /></div></section>
}
