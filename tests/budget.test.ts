import test from 'node:test'
import assert from 'node:assert/strict'
import { parseBudgetCents } from '../src/lib/budget'

test('typed USD budgets accept whole amounts, cents, currency prefixes and decimal commas', () => {
  for (const [text, cents] of [['24', 2400], ['24.50', 2450], ['$24.50', 2450], [' USD 24,50 ', 2450], ['1.01', 101], ['200', 20000], ['24.', 2400]] as const) {
    assert.equal(parseBudgetCents(text), cents, text)
  }
})

test('invalid or out-of-range budgets are rejected instead of rounded into a different amount', () => {
  for (const text of ['', '0', '0.99', '200.01', '-24', '24.501', '2e1', '1,000', '24 dollars', 'NaN', 'Infinity']) {
    assert.equal(parseBudgetCents(text), null, text)
  }
})
