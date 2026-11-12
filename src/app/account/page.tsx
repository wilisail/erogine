import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { currentSession } from '@/server/auth'
import { getDatabase } from '@/server/database'
import { SignOut } from '@/components/sign-out'
export const metadata: Metadata = { title: 'Your account' }
export const dynamic = 'force-dynamic'
export default async function Account() {
  const session = await currentSession()
  if (!session) redirect('/login')
  const orders = await getDatabase().order.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: 'desc' }, take: 30, include: { items: true } })
  return <section className="container account-layout"><div className="account-heading"><div><p className="eyebrow">Your corner of Erogine</p><h1>Hello, <em>{session.user.name.split(' ')[0]}.</em></h1><p className="muted">A home for your details and your discoveries.</p></div><SignOut /></div><div className="account-grid"><aside className="profile-card"><span className="avatar" aria-hidden="true">{session.user.name[0]?.toUpperCase()}</span><h2>{session.user.name}</h2><p>{session.user.email}</p><span className="pill">Erogine member</span></aside><div className="orders-card"><div className="section-heading"><h2>Your orders</h2><span>{orders.length} {orders.length === 1 ? 'order' : 'orders'}</span></div>{orders.length ? <div>{orders.map(order => <article className="order-row" key={order.id}><div><strong>{order.items.map(item => item.title).join(', ') || 'Your Erogine order'}</strong><p className="muted">{order.createdAt.toLocaleDateString('en-GB')} · {order.id.slice(0, 8)}</p></div><div><strong>{new Intl.NumberFormat('en-US', { style: 'currency', currency: order.currency }).format(order.totalCents / 100)}</strong><p className="muted">{order.status}</p></div></article>)}</div> : <div className="empty-state"><span aria-hidden="true">↗</span><h3>Your first find is still ahead.</h3><p>When you place an order, you’ll find it here.</p><Link href="/" className="button secondary">Explore Erogine<span aria-hidden="true">↗</span></Link></div>}</div></div></section>
}
