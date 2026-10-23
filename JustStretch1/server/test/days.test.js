import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { recentDays } from '../routes/dashboard.js'

// Pure date logic behind the dashboard week strip. Needs no database.
describe('recentDays', () => {
  // 2026-10-20 13:00 in Manila
  const now = new Date('2026-10-20T05:00:00Z')

  test('returns the last 7 Manila days, oldest first, ending today', () => {
    const days = recentDays(new Set(['2026-10-16', '2026-10-19', '2026-10-01']), now)
    assert.deepEqual(
      days.map((d) => d.date),
      ['2026-10-14', '2026-10-15', '2026-10-16', '2026-10-17', '2026-10-18', '2026-10-19', '2026-10-20'],
    )
    assert.deepEqual(
      days.map((d) => d.active),
      [false, false, true, false, false, true, false],
    )
  })

  test('uses the Manila date, not UTC', () => {
    // 2026-10-19 17:00Z is already 2026-10-20 01:00 in Manila
    const days = recentDays(new Set(['2026-10-20']), new Date('2026-10-19T17:00:00Z'))
    assert.equal(days.at(-1).date, '2026-10-20')
    assert.equal(days.at(-1).active, true)
  })
})
