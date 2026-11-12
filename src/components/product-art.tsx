import Image from 'next/image'
import type { Product } from '@/lib/catalogue'
export function ProductArt({ product }: { product: Product }) {
  return <div className="catalogue-art"><Image
    src={'/images/products/' + product.id + '.webp'}
    alt={product.title}
    fill
    sizes="(max-width: 650px) calc(100vw - 40px), (max-width: 950px) calc((100vw - 80px) / 2), 550px"
    className="catalogue-photo"
  /></div>
}

