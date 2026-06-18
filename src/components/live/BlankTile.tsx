interface BlankTileProps {
  tileHeight: number
}

export function BlankTile({ tileHeight }: BlankTileProps) {
  return (
    <div
      aria-hidden="true"
      style={{ height: `${tileHeight}px` }}
      className="w-full bg-surface opacity-30 border border-[var(--color-border)] cursor-default pointer-events-none"
    />
  )
}
