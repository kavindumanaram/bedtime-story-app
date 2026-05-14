import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'

interface StepOption {
  emoji: string
  label: string
  value: string
}

interface Step {
  label: string
  subLabel: string
  paramKey: string
  options: StepOption[]
}

const STEPS: Step[] = [
  {
    label: 'Pick a world',
    subLabel: 'Where does the story happen?',
    paramKey: 'theme',
    options: [
      { emoji: '🦁', label: 'Animals', value: 'animals' },
      { emoji: '🧙', label: 'Magic', value: 'magic' },
      { emoji: '🚀', label: 'Space', value: 'space' },
      { emoji: '🌊', label: 'Ocean', value: 'ocean' },
      { emoji: '🏰', label: 'Castle', value: 'castle' },
      { emoji: '🦋', label: 'Nature', value: 'nature' },
      { emoji: '👻', label: 'Spooky', value: 'spooky' },
      { emoji: '🤝', label: 'Friends', value: 'friendship' },
    ],
  },
  {
    label: 'Pick a feeling',
    subLabel: 'What kind of story?',
    paramKey: 'mood',
    options: [
      { emoji: '😴', label: 'Calm & Cozy', value: 'calm' },
      { emoji: '🎉', label: 'Fun & Silly', value: 'silly' },
      { emoji: '🌟', label: 'Exciting!', value: 'exciting' },
      { emoji: '💝', label: 'Heartwarming', value: 'warm' },
    ],
  },
  {
    label: 'What to learn?',
    subLabel: "What's the big lesson?",
    paramKey: 'lesson',
    options: [
      { emoji: '💛', label: 'Kindness', value: 'kindness' },
      { emoji: '🦁', label: 'Courage', value: 'courage' },
      { emoji: '🤝', label: 'Sharing', value: 'sharing' },
      { emoji: '🔍', label: 'Curiosity', value: 'curiosity' },
    ],
  },
]

export const MagicWand: React.FC = () => {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)
  const [selections, setSelections] = useState<Record<string, string>>({})

  const currentStep = STEPS[step]

  const handleSelect = (value: string) => {
    const updated = { ...selections, [currentStep.paramKey]: value }
    setSelections(updated)
    if (step < STEPS.length - 1) {
      setStep(s => s + 1)
    } else {
      const params = new URLSearchParams(updated)
      setOpen(false)
      setStep(0)
      setSelections({})
      navigate(`/create?${params.toString()}`)
    }
  }

  const handleClose = () => {
    setOpen(false)
    setStep(0)
    setSelections({})
  }

  return (
    <>
      {/* FAB Button */}
      <motion.button
        onClick={() => setOpen(true)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.92 }}
        className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 bg-gradient-to-r from-orange-500 to-yellow-400"
        style={{ boxShadow: '0 0 24px rgba(255,140,0,0.5)' }}
        aria-label="Create a story"
      >
        ✨
      </motion.button>

      {/* Overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-6"
            style={{ background: 'rgba(20,20,70,0.97)', backdropFilter: 'blur(20px)' }}
          >
            {/* Close */}
            <button
              onClick={handleClose}
              className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>

            {/* Step dots */}
            <div className="flex gap-2 mb-8">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full transition-all duration-300"
                  style={{ background: i <= step ? '#FDE047' : 'rgba(255,255,255,0.2)' }}
                />
              ))}
            </div>

            {/* Step content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.25 }}
                className="w-full max-w-sm text-center"
              >
                <h2 className="text-3xl font-black text-white mb-1">
                  {currentStep.label}
                </h2>
                <p className="text-blue-100/60 text-sm mb-8">{currentStep.subLabel}</p>

                <div className={`grid gap-3 ${currentStep.options.length > 4 ? 'grid-cols-4' : 'grid-cols-2'}`}>
                  {currentStep.options.map((opt) => (
                    <motion.button
                      key={opt.value}
                      onClick={() => handleSelect(opt.value)}
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.93 }}
                      className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all"
                      style={{ borderColor: 'rgba(0,210,255,0.2)', background: 'rgba(45,45,112,0.4)' }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(253,224,71,0.6)'
                        ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(45,45,112,0.7)'
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(0,210,255,0.2)'
                        ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(45,45,112,0.4)'
                      }}
                    >
                      <span className="text-3xl">{opt.emoji}</span>
                      <span className="text-xs font-semibold text-blue-100/80 leading-tight">
                        {opt.label}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Back button */}
            {step > 0 && (
              <button
                onClick={() => setStep(s => s - 1)}
                className="mt-8 text-sm text-blue-100/40 hover:text-blue-100/70 transition-colors"
              >
                ← back
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
