import type { Metadata } from 'next'
import { CartClient } from '@/components/cart-client'
export const metadata: Metadata = { title: 'Your cart' }
export default function CartPage() { return <CartClient /> }
