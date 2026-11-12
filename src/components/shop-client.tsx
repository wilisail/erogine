'use client'
import { useState } from 'react'
import { products } from '@/lib/catalogue'
import { ProductCard } from './product-card'
export function ShopClient() {
  const [query, setQuery] = useState(''), [category, setCategory] = useState('All')
  const needle = query.trim().toLowerCase()
  const matches = products.filter(product => (category === 'All' || product.category === category) && [product.title, product.description, ...product.tags].join(' ').toLowerCase().includes(needle))
  return <><div className="catalogue-tools"><div className="category-tabs" aria-label="Filter products">{['All', 'Build', 'Play', 'Collect'].map(value => <button type="button" key={value} className={category === value ? 'active' : ''} aria-pressed={category === value} onClick={() => setCategory(value)}>{value}</button>)}</div><label className="search-field"><span className="sr-only">Search products</span><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search little discoveries…" /></label></div><p className="result-count" role="status">{matches.length} {matches.length === 1 ? 'discovery' : 'discoveries'}</p>{matches.length ? <div className="product-grid">{matches.map(product => <ProductCard key={product.id} product={product} />)}</div> : <div className="empty-state"><h2>No discoveries here yet.</h2><p>Try a different word or category.</p><button className="button secondary" onClick={() => { setQuery(''); setCategory('All') }}>Reset filters</button></div>}</>
}
