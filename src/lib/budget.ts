// Parse the shopper's USD input into exact integer cents before making an AI call.
export function parseBudgetCents(value: string): number | null {
  const match = /^(?:USD\s*|\$\s*)?(\d+)(?:[.,](\d{0,2}))?$/i.exec(value.trim())
  if (!match) return null
  const cents = Number(match[1]) * 100 + Number((match[2] ?? '').padEnd(2, '0'))
  return Number.isSafeInteger(cents) && cents >= 100 && cents <= 20000 ? cents : null
}
