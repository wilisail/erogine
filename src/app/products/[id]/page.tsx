import { notFound } from 'next/navigation'
import { findProduct } from '@/lib/catalogue'
import { ProductDetail } from '@/components/product-detail'
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const product = findProduct((await params).id)
  return { title: product?.title || 'Product not found' }
}
export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const product = findProduct((await params).id)
  if (!product) notFound()
  return <ProductDetail product={product} />
}
