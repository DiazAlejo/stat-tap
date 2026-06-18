interface FinalScoreHeaderProps {
  teamAName: string
  teamBName: string
  scoreA: number
  scoreB: number
  isLive: boolean
}

export function FinalScoreHeader({ teamAName, teamBName, scoreA, scoreB, isLive }: FinalScoreHeaderProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-8">
        <div className="flex flex-col items-end gap-1">
          <span className="font-display font-bold text-sm uppercase tracking-widest text-team-a">{teamAName}</span>
          <span className="font-display font-bold text-[72px] leading-none text-score tabular-nums">{scoreA}</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="font-display font-bold text-4xl text-muted">–</span>
          <span className={`font-display font-bold text-xs uppercase tracking-widest ${isLive ? 'text-primary' : 'text-muted'}`}>
            {isLive ? 'LIVE' : 'FINAL'}
          </span>
        </div>
        <div className="flex flex-col items-start gap-1">
          <span className="font-display font-bold text-sm uppercase tracking-widest text-team-b">{teamBName}</span>
          <span className="font-display font-bold text-[72px] leading-none text-score tabular-nums">{scoreB}</span>
        </div>
      </div>
    </div>
  )
}
