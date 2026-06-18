import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSingle = vi.fn()
const mockFrom = vi.fn()

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({ from: mockFrom })),
}))

const { getMeta, getEvents, pushEvent, popEvent, getSnapshot } = await import('@/lib/db')

describe('db helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getMeta returns null when game not found', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    })
    const result = await getMeta('nonexistent')
    expect(result).toBeNull()
  })

  it('getMeta returns meta object when game exists', async () => {
    const fakeMeta = { id: 'game-1', teamA: { name: 'Lakers' }, teamB: { name: 'Celtics' }, players: [], mode: 'points-only', status: 'live', createdAt: 1 }
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { meta: fakeMeta }, error: null }),
        }),
      }),
    })
    const result = await getMeta('game-1')
    expect(result).toEqual(fakeMeta)
  })

  it('getEvents returns empty array when no events', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    })
    const result = await getEvents('game-1')
    expect(result).toEqual([])
  })

  it('getEvents returns payloads in order', async () => {
    const fakeEvents = [
      { id: 'e1', playerId: 'p1', team: 'A', actionType: 'FG_MAKE', points: 2, timestamp: 1 },
      { id: 'e2', playerId: 'p1', team: 'A', actionType: 'FT_MAKE', points: 1, timestamp: 2 },
    ]
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: fakeEvents.map(e => ({ payload: e })), error: null }),
        }),
      }),
    })
    const result = await getEvents('game-1')
    expect(result).toEqual(fakeEvents)
  })

  it('popEvent returns null when no events exist', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }),
      }),
    })
    const result = await popEvent('game-1')
    expect(result).toBeNull()
  })

  it('getSnapshot returns null when snapshot column is null', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { snapshot: null }, error: null }),
        }),
      }),
    })
    const result = await getSnapshot('game-1')
    expect(result).toBeNull()
  })
})
