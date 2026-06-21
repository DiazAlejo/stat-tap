interface BlankTileProps {
  tileHeight: number
  teamColor: string
}

export function BlankTile({ tileHeight, teamColor }: BlankTileProps) {
  return (
    <div
      aria-hidden="true"
      style={{
        height: `${tileHeight}px`,
        backgroundColor: `color-mix(in srgb, ${teamColor} 4%, var(--color-surface))`,
        borderColor: `color-mix(in srgb, ${teamColor} 15%, transparent)`,
      }}
      className="w-full rounded-md border border-dashed opacity-40 cursor-default pointer-events-none"
    />
  )
}
