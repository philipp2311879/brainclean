import { motion } from 'framer-motion'
import { useSoundStore } from '../../store/soundStore'

export function SoundControl() {
  const { sfxEnabled, toggle } = useSoundStore()
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={toggle}
      title={sfxEnabled ? 'Sound ausschalten' : 'Sound einschalten'}
      className="flex items-center justify-center w-9 h-9 rounded-lg border border-[#d1d5db] bg-white text-[#475569] cursor-pointer hover:border-[#4f8cff] hover:text-[#4f8cff] transition-all text-base select-none"
    >
      {sfxEnabled ? '🔊' : '🔇'}
    </motion.button>
  )
}
