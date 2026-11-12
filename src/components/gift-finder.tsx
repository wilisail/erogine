'use client'
import Link from 'next/link'
import { useState, type FormEvent } from 'react'
import type { Product } from '@/lib/catalogue'
import { ApiClientError, paymentMutation } from '@/lib/api-client'
import { ProductCard } from './product-card'
type Pick = { product: Product; reason: string }
export function GiftFinder({ configured, signedIn }: { configured: boolean; signedIn: boolean }) {
  const [busy, setBusy] = useState(false), [error, setError] = useState('')
  const [results, setResults] = useState<Pick[] | null>(null), [needsLogin, setNeedsLogin] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    const form = new FormData(event.currentTarget)
    setBusy(true); setError(''); setResults(null); setNeedsLogin(false)
    try {
      const data = await paymentMutation('/api/recommendations', { interests: String(form.get('interests') || ''), maxBudgetCents: Math.round(Number(form.get('budget')) * 100) })
      setResults(data.recommendations)
    } catch (problem) {
      if (problem instanceof ApiClientError && (problem.code === 'UNAUTHENTICATED' || problem.code === 'INVALID_SESSION')) setNeedsLogin(true)
      setError(problem instanceof Error ? problem.message : 'Please try again shortly.')
    } finally { setBusy(false) }
  }
  return <section className="gift-finder" id="gift-finder" aria-labelledby="gift-finder-title"><div className="gift-finder-heading"><div><p className="eyebrow">A little help choosing</p><h2 id="gift-finder-title">Who are we <em>shopping for?</em></h2></div><p className="muted">Tell us what they love. AI picks up to three alternatives from this collection, within your budget per item.</p></div>
    <form className="gift-form" onSubmit={submit}><label>Interests<input name="interests" placeholder="Space, building things, quiet desk breaks…" required minLength={3} maxLength={240} disabled={busy} /></label><label>Budget per item · USD<input name="budget" type="number" min="1" max="200" step="1" defaultValue="30" required disabled={busy} /></label><button className="button primary" disabled={busy || !configured || !signedIn} type="submit">{busy ? 'Finding a little inspiration…' : 'Find my picks →'}</button></form>
    {!configured ? <p className="finder-note">AI connection is being prepared. Explore the collection below while setup is completed.</p> : !signedIn ? <p className="finder-note"><Link href="/login?next=/shop">Sign in</Link> or <Link href="/register?next=/shop">create an account</Link> to use the gift finder.</p> : <p className="finder-note">Your interests and the product catalogue are sent to OpenRouter. Please leave out personal details. These are individual options; your cart total depends on what you add.</p>}
    {error ? <p className="error-message" role="alert">{error}{needsLogin ? <> <Link href="/login?next=/shop">Sign in again →</Link></> : null}</p> : null}
    {results ? results.length ? <div aria-live="polite"><p className="recommendation-heading">A few ideas for your kind of curious</p><div className="product-grid">{results.map(pick => <ProductCard key={pick.product.id} product={pick.product} reason={pick.reason} />)}</div></div> : <p className="payment-message" role="status">No products fit that budget yet. Try at least USD 12 per item or browse below.</p> : null}
  </section>
}
