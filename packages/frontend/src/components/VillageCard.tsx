import React from 'react'
import { motion } from 'framer-motion'
import type { CommunityStory } from '@bedtime/shared'

interface Props {
  story: CommunityStory
  rank?: number
  onRemix: () => void
  index?: number
}

const TRAIT_MAP: Record<string, { label: string; emoji: string }> = {
  adventure: { label: 'Brave', emoji: '🦁' },
  animals:   { label: 'Brave', emoji: '🦁' },
  dragon:    { label: 'Brave', emoji: '🐉' },
  fantasy:   { label: 'Curious', emoji: '✨' },
  ocean:     { label: 'Curious', emoji: '🌊' },
  space:     { label: 'Smart', emoji: '🔍' },
  mystery:   { label: 'Smart', emoji: '🔍' },
  friendship:{ label: 'Kind', emoji: '💛' },
  nature:    { label: 'Kind', emoji: '🌿' },
}

function getTrait(theme: string) {
  return TRAIT_MAP[theme.toLowerCase()] ?? { label: 'Curious', emoji: '✨' }
}

export const VillageCard: React.FC<Props> = ({ story, rank, onRemix, index = 0 }) => {
  const trait = getTrait(story.theme)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35 }}
      className="flex-shrink-0 w-48 rounded-2xl overflow-hidden cursor-pointer select-none border"
      style={{
        background: 'rgba(45,45,112,0.6)',
        borderColor: 'rgba(0,210,255,0.3)',
        boxShadow: '0 0 20px rgba(0,210,255,0.2)',
      }}
      whileHover={{ scale: 1.04, boxShadow: '0 0 28px rgba(0,210,255,0.35)' }}
      whileTap={{ scale: 0.97 }}
    >
      {/* Cover */}
      <div
        className="relative h-40 w-full"
        style={{ background: story.coverGradient }}
      >
        {/* Rank badge */}
        {rank !== undefined && (
          <span
            className="absolute top-2 left-2 w-8 h-8 rounded-full flex items-center justify-center text-sm font-black z-10"
            style={{ background: '#FDE047', color: '#1A1A40' }}
          >
            {rank}
          </span>
        )}

        {/* Trait badge — cyan information style */}
        <span
          className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold backdrop-blur-sm z-10"
          style={{ background: 'rgba(0,210,255,0.2)', color: '#00D2FF', border: '1px solid rgba(0,210,255,0.4)' }}
        >
          {trait.emoji} {trait.label}
        </span>

        {/* View count */}
        <span className="absolute bottom-2 left-2 text-xs font-medium" style={{ color: 'rgba(0,210,255,0.7)' }}>
          {(story.viewCount / 1000).toFixed(1)}k reads
        </span>
      </div>

      {/* Content */}
      <div className="p-3 flex flex-col gap-2">
        <p className="text-white font-semibold text-sm leading-snug line-clamp-2 drop-shadow-sm">
          {story.title}
        </p>
        <div className="flex flex-wrap gap-1">
          {story.tags.slice(0, 2).map(tag => (
            <span
              key={tag}
              className="px-1.5 py-0.5 rounded-md text-xs"
              style={{ background: 'rgba(0,210,255,0.12)', color: 'rgba(0,210,255,0.7)' }}
            >
              {tag}
            </span>
          ))}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onRemix() }}
          className="mt-1 w-full py-1.5 rounded-xl text-xs font-bold transition-opacity hover:opacity-90 active:scale-95"
          style={{ background: '#FDE047', color: '#1A1A40' }}
        >
          Remix ✨
        </button>
      </div>
    </motion.div>
  )
}
