import type { Metadata } from 'next'
import { ShopClient } from '@/components/shop-client'
import { GiftFinder } from '@/components/gift-finder'
import { recommendationConfig } from '@/server/recommendations'
import { currentSession } from '@/server/auth'
export const metadata: Metadata = { title: 'The little shop' }
export default async function Shop() {
  const session = await currentSession()
  return <section className="container shop-layout"><div className="shop-heading"><div><p className="eyebrow">The everyday collection</p><h1>Little discoveries.<br /><em>Big possibilities.</em></h1></div><p className="muted">Eight playful finds for curious minds, creative breaks and thoughtful gifts. All purchases use sandbox funds.</p></div><GiftFinder configured={recommendationConfig().configured} signedIn={Boolean(session)} /><ShopClient /></section>
}
