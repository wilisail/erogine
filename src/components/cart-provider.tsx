'use client'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { CART_STORAGE_KEY, changeCart, parseCart, type CartLine } from '@/lib/cart'

type CartContext = { items: CartLine[]; ready: boolean; setQuantity: (id: string, quantity: number) => void; add: (id: string) => void; clear: () => void }
const Context = createContext<CartContext | null>(null)
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([]), [ready, setReady] = useState(false)
  useEffect(() => {
    function load() {
      try { setItems(parseCart(JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || '[]'))) } catch { setItems([]) }
    }
    load(); setReady(true)
    function storage(event: StorageEvent) { if (event.key === CART_STORAGE_KEY || event.key === null) load() }
    window.addEventListener('storage', storage)
    return () => window.removeEventListener('storage', storage)
  }, [])
  function save(next: CartLine[]) {
    try { localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(next)) } catch { /* The cart still works in memory when browser storage is unavailable. */ }
    setItems(next)
  }
  function setQuantity(id: string, quantity: number) { save(changeCart(items, id, quantity)) }
  return <Context.Provider value={{ items, ready, setQuantity, add: id => setQuantity(id, Math.min(99, (items.find(item => item.productId === id)?.quantity ?? 0) + 1)), clear: () => save([]) }}>{children}</Context.Provider>
}
export function useCart() {
  const value = useContext(Context)
  if (!value) throw new Error('CartProvider is missing')
  return value
}
