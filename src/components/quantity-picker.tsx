'use client'
// Adapted from spree/storefront's MIT quantity-picker.tsx at 63cf0dc.
// Copyright (c) 2026 Vendo Connect Inc., Vendo Sp. z o.o.; see licenses/spree-MIT.txt.
import { useState } from 'react'
export function QuantityPicker({ quantity, onChange, label, disabled = false }: { quantity: number; onChange: (quantity: number) => void; label: string; disabled?: boolean }) {
  const [draft, setDraft] = useState<string | null>(null)
  function commit() {
    if (draft === null) return
    setDraft(null)
    const parsed = Number.parseInt(draft, 10)
    if (!Number.isNaN(parsed)) onChange(Math.max(1, Math.min(99, parsed)))
  }
  return <div className="quantity-picker"><button type="button" disabled={disabled || quantity <= 1} onClick={() => onChange(quantity - 1)} aria-label={'Decrease ' + label}>−</button><input aria-label={label + ' quantity'} inputMode="numeric" pattern="[0-9]*" autoComplete="off" value={draft ?? String(quantity)} disabled={disabled} onChange={event => setDraft(event.target.value.replace(/\D/g, ''))} onFocus={event => event.target.select()} onBlur={commit} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); event.currentTarget.blur() } else if (event.key === 'Escape') { event.stopPropagation(); setDraft(null) } }} /><button type="button" disabled={disabled || quantity >= 99} onClick={() => onChange(quantity + 1)} aria-label={'Increase ' + label}>+</button></div>
}
