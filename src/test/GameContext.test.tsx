import { describe, it, expect } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { GameProvider, useGame } from '@/context/GameContext'
import type { GameMeta } from '@/lib/types'

const mockMeta: GameMeta = {
  id: 'game-1',
  teamA: { name: 'Lakers' },
  teamB: { name: 'Celtics' },
  players: [
    { id: 'p1', team: 'A', jersey: '23', name: 'Jordan', displayLabel: '23 · Jordan', slot: 1 },
    { id: 'p2', team: 'B', jersey: '7', name: null, displayLabel: '7', slot: 1 },
  ],
  mode: 'points-only',
  status: 'live',
  createdAt: Date.now(),
}

const initialEvents = [
  { id: 'e1', playerId: 'p1', team: 'A' as const, actionType: 'FG_MAKE' as const, points: 2, timestamp: Date.now() },
]

function TestConsumer() {
  const { derived, selectedPlayerId, syncStatus } = useGame()
  return (
    <div>
      <span data-testid="score-a">{derived.scoreA}</span>
      <span data-testid="score-b">{derived.scoreB}</span>
      <span data-testid="selected">{selectedPlayerId ?? 'none'}</span>
      <span data-testid="sync">{syncStatus}</span>
    </div>
  )
}

function TestDispatcher() {
  const { dispatch } = useGame()
  return (
    <button
      onClick={() =>
        dispatch({
          type: 'ADD_EVENT',
          event: { id: 'e2', playerId: 'p2', team: 'B', actionType: '3PT_MAKE', points: 3, timestamp: Date.now() },
        })
      }
    >
      add event
    </button>
  )
}

describe('GameContext', () => {
  it('derives initial state from events', () => {
    render(
      <GameProvider meta={mockMeta} initialEvents={initialEvents}>
        <TestConsumer />
      </GameProvider>
    )
    expect(screen.getByTestId('score-a').textContent).toBe('2')
    expect(screen.getByTestId('score-b').textContent).toBe('0')
  })

  it('updates score when ADD_EVENT dispatched', async () => {
    render(
      <GameProvider meta={mockMeta} initialEvents={initialEvents}>
        <TestConsumer />
        <TestDispatcher />
      </GameProvider>
    )
    act(() => {
      screen.getByText('add event').click()
    })
    expect(screen.getByTestId('score-b').textContent).toBe('3')
  })

  it('shows synced as default syncStatus', () => {
    render(
      <GameProvider meta={mockMeta} initialEvents={[]}>
        <TestConsumer />
      </GameProvider>
    )
    expect(screen.getByTestId('sync').textContent).toBe('synced')
  })
})
