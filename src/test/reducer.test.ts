import { describe, it, expect } from 'vitest'
import { gameReducer } from '@/lib/reducer'
import type { GameEvent } from '@/lib/types'

const makeEvent = (overrides: Partial<GameEvent>): GameEvent => ({
  id: 'evt-1',
  playerId: 'player-1',
  team: 'A',
  actionType: 'FG_MAKE',
  points: 2,
  timestamp: Date.now(),
  ...overrides,
})

describe('gameReducer', () => {
  it('returns initial state for empty event list', () => {
    const state = gameReducer([])
    expect(state.scoreA).toBe(0)
    expect(state.scoreB).toBe(0)
    expect(state.playerStats).toEqual({})
  })

  it('adds 2 points to Team A score on FG_MAKE', () => {
    const state = gameReducer([makeEvent({ actionType: 'FG_MAKE', points: 2, team: 'A' })])
    expect(state.scoreA).toBe(2)
    expect(state.scoreB).toBe(0)
  })

  it('adds 3 points to Team B score on 3PT_MAKE', () => {
    const state = gameReducer([makeEvent({ actionType: '3PT_MAKE', points: 3, team: 'B' })])
    expect(state.scoreA).toBe(0)
    expect(state.scoreB).toBe(3)
  })

  it('adds 1 point on FT_MAKE', () => {
    const state = gameReducer([makeEvent({ actionType: 'FT_MAKE', points: 1, team: 'A' })])
    expect(state.scoreA).toBe(1)
  })

  it('adds 0 points on any MISS', () => {
    const events = [
      makeEvent({ actionType: 'FG_MISS', points: 0 }),
      makeEvent({ actionType: '3PT_MISS', points: 0 }),
      makeEvent({ actionType: 'FT_MISS', points: 0 }),
    ]
    const state = gameReducer(events)
    expect(state.scoreA).toBe(0)
  })

  it('tracks fgMakes and fgAttempts correctly', () => {
    const events = [
      makeEvent({ actionType: 'FG_MAKE', points: 2 }),
      makeEvent({ actionType: 'FG_MISS', points: 0 }),
    ]
    const state = gameReducer(events)
    expect(state.playerStats['player-1'].fgMakes).toBe(1)
    expect(state.playerStats['player-1'].fgAttempts).toBe(2)
  })

  it('tracks threeMakes and threeAttempts correctly', () => {
    const events = [
      makeEvent({ actionType: '3PT_MAKE', points: 3 }),
      makeEvent({ actionType: '3PT_MISS', points: 0 }),
      makeEvent({ actionType: '3PT_MISS', points: 0 }),
    ]
    const state = gameReducer(events)
    expect(state.playerStats['player-1'].threeMakes).toBe(1)
    expect(state.playerStats['player-1'].threeAttempts).toBe(3)
  })

  it('tracks ftMakes and ftAttempts correctly', () => {
    const events = [
      makeEvent({ actionType: 'FT_MAKE', points: 1 }),
      makeEvent({ actionType: 'FT_MAKE', points: 1 }),
      makeEvent({ actionType: 'FT_MISS', points: 0 }),
    ]
    const state = gameReducer(events)
    expect(state.playerStats['player-1'].ftMakes).toBe(2)
    expect(state.playerStats['player-1'].ftAttempts).toBe(3)
    expect(state.playerStats['player-1'].points).toBe(2)
  })

  it('accumulates points correctly across multiple players', () => {
    const events = [
      makeEvent({ playerId: 'p1', team: 'A', actionType: 'FG_MAKE', points: 2 }),
      makeEvent({ playerId: 'p2', team: 'A', actionType: '3PT_MAKE', points: 3 }),
      makeEvent({ playerId: 'p3', team: 'B', actionType: 'FT_MAKE', points: 1 }),
    ]
    const state = gameReducer(events)
    expect(state.scoreA).toBe(5)
    expect(state.scoreB).toBe(1)
    expect(state.playerStats['p1'].points).toBe(2)
    expect(state.playerStats['p2'].points).toBe(3)
    expect(state.playerStats['p3'].points).toBe(1)
  })

  it('undo simulation: removing last event reverts score', () => {
    const events = [
      makeEvent({ id: 'e1', actionType: 'FG_MAKE', points: 2 }),
      makeEvent({ id: 'e2', actionType: '3PT_MAKE', points: 3 }),
    ]
    const stateWith = gameReducer(events)
    const stateWithout = gameReducer(events.slice(0, -1))
    expect(stateWith.scoreA).toBe(5)
    expect(stateWithout.scoreA).toBe(2)
  })
})
