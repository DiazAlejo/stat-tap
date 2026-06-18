import { describe, it, expect } from 'vitest'
import { emptyStats, totalFgAttempts, totalFgMakes } from '@/lib/game'

describe('totalFgMakes / totalFgAttempts', () => {
  it('sums 2PT and 3PT only, excluding free throws', () => {
    const stats = {
      ...emptyStats(),
      fgMakes: 2,
      fgAttempts: 4,
      threeMakes: 1,
      threeAttempts: 3,
      ftMakes: 5,
      ftAttempts: 6,
    }

    expect(totalFgMakes(stats)).toBe(3)
    expect(totalFgAttempts(stats)).toBe(7)
  })
})
