'use client'
import Link from 'next/link'
import { useState } from 'react'
import { money, type Product } from '@/lib/catalogue'
import { useCart } from './cart-provider'
import { ProductArt } from './product-art'
import { QuantityPicker } from './quantity-picker'
export function ProductDetail({ product }: { product: Product }) {
  const { items, setQuantity, ready } = useCart(), [quantity, setCount] = useState(1), [added, setAdded] = useState(false)
  return <section className="container product-detail"><Link className="back-link" href="/shop">← All discoveries</Link><div className="product-detail-grid"><ProductArt product={product} /><div><p className="eyebrow">{product.category} · The everyday collection</p><h1>{product.title}</h1><p className="muted">{product.description}</p><strong className="detail-price">{money(product.priceCents)}</strong><div className="product-tags">{product.tags.map(tag => <span key={tag}>{tag}</span>)}</div><div className="detail-actions"><QuantityPicker quantity={quantity} onChange={setCount} label={product.title} /><button className="button primary" disabled={!ready} onClick={() => { setQuantity(product.id, Math.min(99, (items.find(item => item.productId === product.id)?.quantity ?? 0) + quantity)); setAdded(true) }}>Add to cart →</button></div>{added ? <p className="added-message" role="status">Added to your cart. <Link href="/cart">View your cart →</Link></p> : null}<p className="checkout-note">Demo product · virtual funds only · no physical delivery.</p></div></div></section>
}
