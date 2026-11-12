import type { Product } from '@/lib/catalogue'
export function ProductArt({ product }: { product: Product }) {
  return <div className={'catalogue-art tone-' + product.color} aria-hidden="true"><div className={'object-art object-' + product.art}>{[0, 1, 2, 3, 4].map(n => <i key={n} />)}</div><span className="art-index">EROGINE · LITTLE DISCOVERIES</span></div>
}
