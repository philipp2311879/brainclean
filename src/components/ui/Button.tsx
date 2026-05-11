import { motion } from 'framer-motion'
import clsx from 'clsx'

interface ButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'danger' | 'gold' | 'ghost' | 'back'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  disabled?: boolean
  className?: string
  fullWidth?: boolean
}

const V: Record<string, string> = {
  primary:   'bg-[#4f8cff] text-white hover:bg-[#3b7aff] shadow-[0_4px_14px_rgba(79,140,255,0.40)]',
  secondary: 'bg-white text-[#0f172a] border-2 border-[#d1d5db] hover:border-[#4f8cff] hover:text-[#4f8cff] shadow-card',
  danger:    'bg-[#ef4444] text-white hover:bg-[#dc2626] shadow-[0_4px_14px_rgba(239,68,68,0.35)]',
  gold:      'bg-[#f59e0b] text-white hover:bg-[#d97706] shadow-[0_4px_14px_rgba(245,158,11,0.40)]',
  ghost:     'bg-transparent text-[#475569] hover:text-[#0f172a] hover:bg-[#f1f5f9]',
  back:      'bg-white text-[#475569] border border-[#d1d5db] hover:text-[#0f172a] hover:border-[#4f8cff] shadow-card',
}

const S: Record<string, string> = {
  sm:  'px-4 py-2.5 text-base min-h-[44px]',
  md:  'px-6 py-3.5 text-lg min-h-[52px]',
  lg:  'px-8 py-4 text-xl min-h-[62px]',
  xl:  'px-10 py-5 text-2xl min-h-[72px]',
}

export function Button({ children, onClick, variant = 'primary', size = 'md', disabled, className, fullWidth }: ButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: disabled ? 1 : 0.96 }}
      whileHover={{ scale: disabled ? 1 : 1.02, y: disabled ? 0 : -1 }}
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'font-display rounded-2xl font-bold transition-all duration-150 cursor-pointer select-none',
        V[variant], S[size],
        fullWidth && 'w-full',
        disabled && 'opacity-40 cursor-not-allowed',
        className,
      )}
    >
      {children}
    </motion.button>
  )
}
