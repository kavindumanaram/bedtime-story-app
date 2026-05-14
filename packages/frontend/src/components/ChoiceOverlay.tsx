import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { Shield, Heart, Zap, Sparkles, Star } from "lucide-react"
import type { StoryChoice } from "@bedtime/shared"
import { VOICE_PROFILES } from "./AudioControls"

type Props = {
  choices: [StoryChoice, StoryChoice]
  childName?: string
  ttsVoice?: string
  ttsSpeed?: number
  onSelect: (choice: StoryChoice) => void
}

const TRAIT_ICONS: Record<StoryChoice["trait"], React.FC<{ className?: string }>> = {
  brave:    Shield,
  kind:     Heart,
  curious:  Zap,
  creative: Sparkles,
  helpful:  Star,
}

export function ChoiceOverlay({ choices, childName, ttsVoice, ttsSpeed, onSelect }: Props) {
  const [isLocked, setIsLocked] = useState(true)
  const [secondsLeft, setSecondsLeft] = useState(45)
  // Frozen refs so countdown effect never restarts due to prop changes
  const onSelectRef = useRef(onSelect)
  const choices0Ref = useRef(choices[0])

  // 2-second lock-out to prevent accidental taps from the previous page-turn
  useEffect(() => {
    const t = setTimeout(() => setIsLocked(false), 2000)
    return () => clearTimeout(t)
  }, [])

  // 45-second countdown — auto-selects first choice if child falls asleep
  useEffect(() => {
    if (secondsLeft <= 0) {
      console.log("[ChoiceOverlay] Auto-selecting first choice (timeout):", choices0Ref.current.label)
      onSelectRef.current(choices0Ref.current)
      return
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft])

  // Speak the choice prompt using the same voice/speed as the story narrator
  useEffect(() => {
    console.log("[ChoiceOverlay] Mounted — choices:", choices.map(c => `${c.label} (${c.trait})`))
    if (!("speechSynthesis" in window)) return
    const name = childName ?? "the hero"
    const utter = new SpeechSynthesisUtterance(`What should ${name} do?`)
    utter.rate = ttsSpeed ?? 0.95
    utter.lang = "en-US"
    const voices = window.speechSynthesis.getVoices().filter((v) => v.lang.startsWith("en"))
    console.log("[ChoiceOverlay] Available EN voices:", voices.map(v => v.name))
    if (ttsVoice) {
      const profile = VOICE_PROFILES.find((p) => p.id === ttsVoice)
      const matched = voices.find((v) =>
        profile?.keywords.some((k) => v.name.toLowerCase().includes(k)),
      )
      if (matched) {
        utter.voice = matched
        console.log("[ChoiceOverlay] TTS voice matched:", matched.name)
      } else {
        console.log("[ChoiceOverlay] TTS voice not matched for profile:", ttsVoice)
      }
    }
    window.speechSynthesis.speak(utter)
    return () => window.speechSynthesis.cancel()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: "rgba(15,23,42,0.92)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <p className="text-white text-xl font-semibold mb-2">
        What should {childName ?? "the hero"} do?
      </p>
      <p className="text-white/60 text-sm mb-8">Choosing in {secondsLeft}s…</p>
      <div className="flex flex-col gap-4 w-full max-w-sm px-6">
        {choices.map((choice, i) => {
          const TraitIcon = TRAIT_ICONS[choice.trait] ?? Star
          return (
            <button
              key={i}
              disabled={isLocked}
              onClick={() => {
                console.log("[ChoiceOverlay] User selected:", { label: choice.label, trait: choice.trait, isLocked })
                onSelect(choice)
              }}
              className={`min-h-[80px] rounded-2xl px-6 py-4 text-white font-semibold text-base transition-all duration-200 ${
                isLocked
                  ? "bg-white/10 opacity-60 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] cursor-pointer shadow-lg shadow-indigo-900/40"
              }`}
            >
              <span className="flex items-center gap-3">
                <TraitIcon className={`w-6 h-6 flex-shrink-0 ${isLocked ? "text-white/40" : "text-indigo-200"}`} />
                <span className="text-left">
                  <span className="block text-lg">{choice.label}</span>
                  <span className="block text-sm text-white/70 mt-0.5">{choice.preview_text}</span>
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </motion.div>
  )
}
