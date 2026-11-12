import type { Metadata } from 'next'
import Link from 'next/link'
import { currentSession } from '@/server/auth'
import './globals.css'

export const metadata: Metadata = { title: { default: 'Erogine — Find your next favourite', template: '%s · Erogine' }, description: 'A thoughtful little shop for curious minds, creative days and everyday collectors.' }

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await currentSession()
  return <html lang="en"><body>
    <div className="announcement">A little curiosity goes a long way.<span>Sandbox preview · no real purchases</span></div>
    <header className="site-header container">
      <Link href="/" className="wordmark" aria-label="Erogine home"><span className="brand-mark" aria-hidden="true">e</span>erogine<span className="brand-dot">.</span></Link>
      <nav aria-label="Main navigation"><Link href="/">Discover</Link><Link href="/account">My account</Link></nav>
      <Link href={session ? '/account' : '/login'} className="header-action">{session ? session.user.name.split(' ')[0] : 'Sign in'}<span aria-hidden="true">↗</span></Link>
    </header>
    <main>{children}</main>
    <footer className="container site-footer"><Link href="/" className="footer-brand">erogine.</Link><p>Small finds. Lasting joy.</p><span>Made for the curious.</span></footer>
  </body></html>
}
