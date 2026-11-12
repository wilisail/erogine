'use client'
export default function ErrorPage({ reset }: { reset: () => void }) {
  return <section className="container status-page"><p className="eyebrow">A small pause</p><h1>Let’s try that again.</h1><p>We couldn’t load this page just now.</p><button className="button primary" onClick={reset}>Try again</button></section>
}
