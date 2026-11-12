'use client'
// Adapted from spree/storefront's MIT ProductCard.tsx at 63cf0dc.
// Copyright (c) 2026 Vendo Connect Inc., Vendo Sp. z o.o.; see licenses/spree-MIT.txt.
import Link from 'next/link'
import { useState } from 'react'
import { money, type Product } from '@/lib/catalogue'
import { useCart } from './cart-provider'
import { ProductArt } from './product-art'
export function ProductCard({ product, reason }: { product: Product; reason?: string }) {
  const { add, ready } = useCart(), [added, setAdded] = useState(false)
  return <article className="product-card"><Link href={'/products/' + product.id} aria-label={'View ' + product.title}><ProductArt product={product} /></Link><div className="product-card-body"><p className="small-label">{product.category}</p><h3><Link href={'/products/' + product.id}>{product.title}</Link></h3><p className={reason ? 'recommendation-reason' : 'product-description'}>{reason || product.description}</p><div className="product-card-bottom"><strong>{money(product.priceCents)}</strong><button className="button secondary" type="button" disabled={!ready} onClick={() => { add(product.id); setAdded(true) }} aria-label={'Add ' + product.title + ' to cart'}>{added ? 'Add another +' : 'Add to cart +'}</button></div>{added ? <Link href="/cart" className="added-message" role="status">Added to your cart · View cart →</Link> : null}</div></article>
}
