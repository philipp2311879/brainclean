import clsx from 'clsx'

interface GlassPanelProps {
  children: React.ReactNode
  className?: string
  glow?: string
  dark?: boolean
  accent?: string
}

export function GlassPanel({ children, className, accent }: GlassPanelProps) {
  return (
    <div
      className={clsx('card', className)}
      style={accent ? { borderColor: accent, borderWidth: 2 } : undefined}
    >
      {children}
    </div>
  )
}
