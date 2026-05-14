import React, { useRef, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Lock, Plus, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useProfileSelection } from '../contexts/ProfileSelectionContext'
import type { Child } from '@bedtime/shared'

const PARENT_PIN = import.meta.env.VITE_PARENT_PIN || '1234'

// ── Emoji badge per interests ─────────────────────────────────────────────────
function getThemeEmoji(child: Child): string {
  const interests = (child.preferences?.interests ?? []).map(i => i.toLowerCase())
  if (interests.some(i => i.includes('space') || i.includes('rocket'))) return '🚀'
  if (interests.some(i => i.includes('dino') || i.includes('dinosaur'))) return '🦖'
  if (interests.some(i => i.includes('animal'))) return '🦁'
  if (interests.some(i => i.includes('ocean') || i.includes('sea'))) return '🐬'
  if (interests.some(i => i.includes('art') || i.includes('creat'))) return '🎨'
  if (interests.some(i => i.includes('music') || i.includes('song'))) return '🎵'
  if (interests.some(i => i.includes('bedtime') || i.includes('calm') || i.includes('sleep'))) return '🌙'
  if (interests.some(i => i.includes('adventure'))) return '⚔️'
  return '⭐'
}

// ── Floating decorative shape ─────────────────────────────────────────────────
const FloatingShape: React.FC<{
  size: number
  top: string
  left: string
  color: string
  animClass: string
  delay: string
  reduced: boolean
}> = ({ size, top, left, color, animClass, delay, reduced }) => (
  <div
    className={`absolute rounded-full blur-3xl opacity-20 pointer-events-none ${reduced ? '' : animClass}`}
    style={{ width: size, height: size, top, left, background: color, animationDelay: delay }}
  />
)

// ── Profile card ──────────────────────────────────────────────────────────────
const ProfileCard: React.FC<{
  child: Child
  onClick: () => void
  reduced: boolean
}> = ({ child, onClick, reduced }) => {
  const emoji = getThemeEmoji(child)

  return (
    <motion.button
      onClick={onClick}
      whileHover={reduced ? {} : { scale: 1.08, y: -8 }}
      whileTap={{ scale: 0.95 }}
      className="flex flex-col items-center gap-3 group focus:outline-none"
    >
      <div className="relative">
        {/* Avatar circle */}
        <div
          className="w-28 h-28 rounded-full flex items-center justify-center text-white text-4xl font-black shadow-2xl border-4 border-white/30 group-hover:border-white/60 group-focus-visible:border-white/80 group-focus-visible:ring-4 group-focus-visible:ring-white/60 transition-all"
          style={{ background: child.avatar_color }}
        >
          {child.name[0].toUpperCase()}
        </div>
        {/* Theme emoji badge */}
        <div
          className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white flex items-center justify-center text-base shadow-md border-2 border-white/40"
          style={{ fontSize: 16 }}
        >
          {emoji}
        </div>
      </div>
      <div className="text-center">
        <p className="text-white font-black text-base drop-shadow-md">{child.name}</p>
        <p className="text-white/60 text-xs font-medium">Age {child.age}</p>
      </div>
    </motion.button>
  )
}

// ── Add profile card ──────────────────────────────────────────────────────────
const AddProfileCard: React.FC<{ reduced: boolean }> = ({ reduced }) => {
  const navigate = useNavigate()

  return (
    <motion.button
      onClick={() => navigate('/profile?addChild=true')}
      whileHover={reduced ? {} : { scale: 1.08, y: -8 }}
      whileTap={{ scale: 0.95 }}
      className="flex flex-col items-center gap-3 focus:outline-none"
    >
      <div className="w-28 h-28 rounded-full flex items-center justify-center border-4 border-dashed border-white/40 hover:border-white/70 focus-visible:border-white/80 focus-visible:ring-4 focus-visible:ring-white/60 transition-all">
        <Plus className="w-10 h-10 text-white/60" />
      </div>
      <p className="text-white/60 font-semibold text-sm">Add Profile</p>
    </motion.button>
  )
}

// ── Parent PIN modal ──────────────────────────────────────────────────────────
const ParentModePINModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const navigate = useNavigate()
  const [digits, setDigits] = useState(['', '', '', ''])
  const [error, setError] = useState(false)
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ]

  const handleDigit = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[index] = digit
    setDigits(next)
    setError(false)

    if (digit && index < 3) {
      inputRefs[index + 1].current?.focus()
    }

    if (index === 3 && digit) {
      const pin = [...next.slice(0, 3), digit].join('')
      if (pin === PARENT_PIN) {
        navigate('/dashboard')
      } else {
        setError(true)
        setDigits(['', '', '', ''])
        inputRefs[0].current?.focus()
      }
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs[index - 1].current?.focus()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        className="w-full max-w-sm rounded-3xl p-8 relative"
        style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(24px)', border: '1.5px solid rgba(255,255,255,0.3)' }}
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-white/60 hover:text-white">
          <X className="w-5 h-5" />
        </button>
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-3">
            <Lock className="w-7 h-7 text-white" />
          </div>
          <h3 className="text-white font-black text-xl">Parent Mode</h3>
          <p className="text-white/60 text-sm mt-1">Enter your PIN to continue</p>
        </div>

        <div className="flex justify-center gap-3 mb-4">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={inputRefs[i]}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={e => handleDigit(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              autoFocus={i === 0}
              className="w-14 h-14 rounded-2xl text-center text-2xl font-black text-white outline-none transition-all"
              style={{
                background: error ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.2)',
                border: error ? '2px solid rgba(239,68,68,0.7)' : '2px solid rgba(255,255,255,0.35)',
              }}
            />
          ))}
        </div>
        {error && (
          <p className="text-red-300 text-xs text-center font-semibold">Incorrect PIN. Try again.</p>
        )}
      </motion.div>
    </motion.div>
  )
}

// ── ProfileSelection ──────────────────────────────────────────────────────────
export const ProfileSelection: React.FC = () => {
  const navigate = useNavigate()
  const { children, setActiveChild } = useAuth()
  const { setProfileSelected } = useProfileSelection()
  const [pinOpen, setPinOpen] = useState(false)
  const reduced = useReducedMotion() ?? false

  const handleSelect = (child: Child) => {
    setActiveChild(child)
    setProfileSelected(true)
    navigate('/')
  }

  const containerVariants = {
    hidden: {},
    visible: reduced ? {} : { transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
  }

  const cardVariants = {
    hidden: reduced ? {} : { opacity: 0, scale: 0.8, y: 20 },
    visible: reduced
      ? {}
      : { opacity: 1, scale: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 20 } },
  }

  return (
    <div
      className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center py-16 px-6"
      style={{
        background: 'linear-gradient(135deg,#0f0e23,#1a1535,#0d1117)',
        backgroundSize: '200% 200%',
        animation: reduced ? 'none' : 'gradientShift 8s ease infinite',
      }}
    >
      {/* Floating background shapes */}
      <FloatingShape size={320} top="-8%" left="5%" color="rgba(124,58,237,0.8)" animClass="animate-floatA" delay="0s" reduced={reduced} />
      <FloatingShape size={200} top="55%" left="72%" color="rgba(6,182,212,0.6)" animClass="animate-floatB" delay="1.2s" reduced={reduced} />
      <FloatingShape size={150} top="70%" left="8%" color="rgba(245,183,49,0.6)" animClass="animate-floatA" delay="2.5s" reduced={reduced} />
      <FloatingShape size={250} top="10%" left="68%" color="rgba(124,58,237,0.5)" animClass="animate-floatB" delay="0.8s" reduced={reduced} />

      {/* Title */}
      <motion.div
        initial={reduced ? {} : { opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12 relative z-10"
      >
        <p className="text-white/70 font-semibold text-sm mb-2 tracking-wide uppercase">
          <span style={{ color: '#F5B731' }}>Hush</span>Tales
        </p>
        <h1 className="text-white font-black drop-shadow-lg" style={{ fontSize: 'clamp(28px, 8vw, 48px)' }}>
          Who's Watching? 🌙
        </h1>
        <p className="text-white/60 text-sm mt-2">Choose your profile to start your bedtime adventure</p>
      </motion.div>

      {/* Profile grid */}
      <motion.div
        className="flex flex-wrap justify-center gap-8 relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {children.map(child => (
          <motion.div key={child.id} variants={cardVariants}>
            <ProfileCard child={child} onClick={() => handleSelect(child)} reduced={reduced} />
          </motion.div>
        ))}
        <motion.div variants={cardVariants}>
          <AddProfileCard reduced={reduced} />
        </motion.div>
      </motion.div>

      {/* Parent Mode button */}
      <motion.button
        initial={reduced ? {} : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        onClick={() => setPinOpen(true)}
        className="mt-14 flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold text-sm text-white transition-colors relative z-10"
        style={{
          background: 'rgba(255,255,255,0.08)',
          backdropFilter: 'blur(12px)',
          border: '1.5px solid rgba(245,183,49,0.4)',
        }}
      >
        <Lock className="w-4 h-4" />
        Parent Mode
      </motion.button>

      {/* PIN modal */}
      <AnimatePresence>
        {pinOpen && <ParentModePINModal onClose={() => setPinOpen(false)} />}
      </AnimatePresence>
    </div>
  )
}
