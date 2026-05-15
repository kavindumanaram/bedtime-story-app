import React, { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Search, Play, Heart, X, ChevronLeft, ChevronRight, Clock, Bell, Sparkles } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useProfileSelection } from '../contexts/ProfileSelectionContext'
import { loadStories } from '../api/storyDb'
import type { GeneratedStory } from '../api/storyDb'
import { getMemoryContext } from '../api/storyMemory'
import { MagicWand } from '../components/MagicWand'
import type { CommunityStory } from '@bedtime/shared'
import type { MemoryContext } from '../api/storyMemory'

// ── Keyframes ─────────────────────────────────────────────────────────────────
const KEYFRAMES = `
  @keyframes floatEmoji {
    0%,100% { transform: translateY(0px) rotate(-3deg) scale(1); }
    50%      { transform: translateY(-18px) rotate(5deg) scale(1.08); }
  }
  @keyframes floatEmoji2 {
    0%,100% { transform: translateY(0px) rotate(5deg) scale(1); }
    55%      { transform: translateY(16px) rotate(-6deg) scale(0.94); }
  }
  @keyframes playGlow {
    0%,100% { box-shadow: 0 0 12px 3px rgba(245,183,49,0.55); }
    50%      { box-shadow: 0 0 28px 8px rgba(245,183,49,0.9); }
  }
`

// ── Constants ─────────────────────────────────────────────────────────────────
const AGE_FILTERS = [
  { label: 'All',   emoji: '🌟' },
  { label: '2+',    emoji: '🐣' },
  { label: '3-5',   emoji: '🦊' },
  { label: '6-7',   emoji: '🚀' },
  { label: '8-9',   emoji: '🐉' },
  { label: 'Space', emoji: '🌙' },
  { label: 'Anime', emoji: '⭐' },
]

const DURATION_FILTERS = ['3-5 min', '5-10 min', '10-15 min', '15-25 min']

const CATEGORIES = [
  { id: 'all',       label: 'All',       emoji: '✨' },
  { id: 'adventure', label: 'Adventure', emoji: '⚔️' },
  { id: 'fantasy',   label: 'Fantasy',   emoji: '🧙' },
  { id: 'animals',   label: 'Animals',   emoji: '🦁' },
  { id: 'space',     label: 'Space',     emoji: '🚀' },
  { id: 'ocean',     label: 'Ocean',     emoji: '🐬' },
  { id: 'nature',    label: 'Nature',    emoji: '🌿' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────
const THEME_GRADIENT: Record<string, string> = {
  adventure: 'linear-gradient(135deg,#450a0a,#991b1b,#c2410c)',
  fantasy:   'linear-gradient(135deg,#2e1065,#5b21b6,#7c3aed)',
  animals:   'linear-gradient(135deg,#052e16,#166534,#15803d)',
  friendship:'linear-gradient(135deg,#4a0520,#9d174d,#be185d)',
  ocean:     'linear-gradient(135deg,#082f49,#0c4a6e,#0e7490)',
  dragon:    'linear-gradient(135deg,#1e1b4b,#4c1d95,#7c3aed)',
  space:     'linear-gradient(135deg,#020617,#0f172a,#1e3a8a)',
  nature:    'linear-gradient(135deg,#052e16,#14532d,#166534)',
}

function getCardAssets(story: CommunityStory | GeneratedStory): { img: string | null; bg: string } {
  const img =
    ('coverImage' in story && story.coverImage)
      ? story.coverImage
      : ('images' in story && story.images?.[0])
        ? story.images[0]
        : null

  const bg =
    ('coverGradient' in story && story.coverGradient)
      ? story.coverGradient
      : THEME_GRADIENT[(story.theme ?? '').toLowerCase()] ?? 'linear-gradient(135deg,#1e3a5f,#1d4ed8,#0369a1)'

  return { img, bg }
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good night'
}

function timeAgo(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  return `${Math.floor(days / 7)}w ago`
}

function matchesFilter(story: CommunityStory | GeneratedStory, filter: string) {
  if (filter === 'all') return true
  const theme = (story.theme ?? '').toLowerCase()
  const tags = 'tags' in story ? story.tags : []
  return theme.includes(filter) || tags.some((t: string) => t.toLowerCase().includes(filter))
}

function matchesSearch(story: CommunityStory | GeneratedStory, q: string) {
  if (!q) return true
  const lq = q.toLowerCase()
  return story.title.toLowerCase().includes(lq) || (story.theme ?? '').toLowerCase().includes(lq)
}

function matchesThemes(story: CommunityStory, themes: string[]) {
  const t = (story.theme ?? '').toLowerCase()
  const tags = story.tags.map((x: string) => x.toLowerCase())
  return themes.some(th => t.includes(th) || tags.some(tag => tag.includes(th)))
}

// ── HeroBanner — styled like the Create page dark header ─────────────────────
const EmojiHeroBanner: React.FC<{ childName: string; onExplore: () => void; onCreate: () => void }> = ({ childName, onExplore, onCreate }) => (
  <div className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg,#0f0e23,#1a1535,#0d1117)', minHeight: 230 }}>
    {/* Purple glow — top right */}
    <div style={{ position: 'absolute', top: '-20%', right: '-5%', width: 260, height: 260, borderRadius: '50%',
      background: 'radial-gradient(circle,rgba(124,58,237,0.4) 0%,transparent 70%)', pointerEvents: 'none' }} />
    {/* Cyan glow — bottom left */}
    <div style={{ position: 'absolute', bottom: '-25%', left: '5%', width: 220, height: 220, borderRadius: '50%',
      background: 'radial-gradient(circle,rgba(6,182,212,0.28) 0%,transparent 70%)', pointerEvents: 'none' }} />

    {/* Floating emojis */}
    {[
      { ch: '✨', top: '10%', right: '16%', size: 28, anim: 'floatEmoji',  dur: '6s',   delay: '0s'   },
      { ch: '🌙', top: '52%', right: '7%',  size: 46, anim: 'floatEmoji2', dur: '8s',   delay: '1.2s' },
      { ch: '⭐', top: '18%', right: '36%', size: 18, anim: 'floatEmoji',  dur: '5.5s', delay: '0.8s' },
      { ch: '🌟', top: '64%', right: '28%', size: 22, anim: 'floatEmoji2', dur: '7s',   delay: '2s'   },
    ].map((d, i) => (
      <div key={i} style={{
        position: 'absolute', top: d.top, right: d.right, fontSize: d.size,
        opacity: 0.65, pointerEvents: 'none', userSelect: 'none',
        animation: `${d.anim} ${d.dur} ease-in-out ${d.delay} infinite`,
      }}>{d.ch}</div>
    ))}

    {/* Bottom fade into white content card */}
    <div style={{ position: 'absolute', inset: 0,
      background: 'linear-gradient(to top, rgba(251,248,255,1) 0%, rgba(251,248,255,0.06) 22%, transparent 45%)',
      pointerEvents: 'none' }} />

    {/* Content */}
    <div className="relative z-10 px-6 py-7" style={{ paddingBottom: 44 }}>
      {/* "Story Feed" label — matches Create's "Story Studio" label */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(245,183,49,0.15)', border: '1px solid rgba(245,183,49,0.35)' }}>
          <Sparkles className="w-4 h-4" style={{ color: '#F5B731' }} />
        </div>
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(245,183,49,0.8)' }}>
          ✦ Story Feed
        </span>
      </div>

      <h1 className="text-white font-black mb-1.5"
        style={{ fontSize: 'clamp(22px,5vw,32px)', letterSpacing: '-0.02em', lineHeight: 1.12 }}>
        {getGreeting()}, {childName}! 🌙
      </h1>
      <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, marginBottom: 22, maxWidth: 300 }}>
        Enchanting bedtime stories crafted just for you
      </p>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <motion.button whileTap={{ scale: 0.93 }} onClick={onExplore}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '11px 22px', borderRadius: 99,
            background: 'linear-gradient(135deg,#F5B731,#D4950A)',
            color: '#1a0e00', fontWeight: 900, fontSize: 14,
            border: 'none', cursor: 'pointer',
            animation: 'playGlow 2.4s ease-in-out infinite',
          }}>
          <Play style={{ width: 15, height: 15, fill: '#1a0e00' }} />
          Explore Stories
        </motion.button>
        <motion.button whileTap={{ scale: 0.93 }} onClick={onCreate}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '11px 18px', borderRadius: 99,
            background: 'rgba(255,255,255,0.10)', backdropFilter: 'blur(12px)',
            border: '1.5px solid rgba(255,255,255,0.25)', color: '#fff',
            fontWeight: 700, fontSize: 13, cursor: 'pointer',
          }}>
          <Sparkles style={{ width: 14, height: 14 }} />
          Create New
        </motion.button>
      </div>
    </div>
  </div>
)

// ── LandscapeCard — wide horizontal card (Editor's Pick) ──────────────────────
interface LandscapeCardProps {
  title: string
  coverImg: string | null
  themeBg: string
  meta?: string
  duration?: string
  badge?: string
  badgeBg?: string
  onPlay: () => void
  index?: number
}

const LandscapeCard: React.FC<LandscapeCardProps> = ({ title, coverImg, themeBg, meta, duration, badge, badgeBg = '#F5B731', onPlay, index = 0 }) => {
  const [imgErr, setImgErr] = useState(false)
  const showImg = coverImg && !imgErr

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.07, duration: 0.35 }}
      whileTap={{ scale: 0.96 }}
      onClick={onPlay}
      className="flex-shrink-0 relative overflow-hidden cursor-pointer"
      style={{
        width: 280, height: 160,
        borderRadius: 20,
        background: showImg ? '#000' : themeBg,
        boxShadow: '0 12px 40px rgba(16,24,40,0.28)',
        border: '1px solid rgba(255,255,255,0.06)',
        overflow: 'hidden',
        backdropFilter: 'saturate(120%) blur(6px)',
      }}
    >
      {showImg && (
        <img src={coverImg!} alt={title} onError={() => setImgErr(true)}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9 }} />
      )}

      {/* Gradient overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to top, rgba(2,6,23,0.85) 0%, rgba(2,6,23,0.32) 55%, rgba(2,6,23,0.06) 100%)',
      }} />

      {/* Top row */}
      <div style={{ position: 'absolute', top: 10, left: 10, right: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        {badge && (
          <span style={{
            padding: '3px 9px', borderRadius: 99, fontSize: 10, fontWeight: 800,
            background: badgeBg, color: badgeBg === '#F5B731' ? '#1a0e00' : '#fff',
          }}>
            {badge}
          </span>
        )}
        <button onClick={e => { e.stopPropagation() }}
          style={{ marginLeft: 'auto', width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', border: 'none', cursor: 'pointer' }}>
          <Heart style={{ width: 13, height: 13, color: '#fff' }} />
        </button>
      </div>

      {/* Bottom content */}
      <div style={{ position: 'absolute', bottom: 10, left: 12, right: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
          <p style={{
            color: '#fff', fontWeight: 800, fontSize: 13, lineHeight: 1.3,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {title}
          </p>
          {(meta || duration) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              {duration && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: 600 }}>
                  <Clock style={{ width: 9, height: 9 }} />{duration}
                </span>
              )}
              {meta && <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>{meta}</span>}
            </div>
          )}
        </div>
        {/* Play button */}
        <div style={{
          width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg,#F5B731,#D4950A)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 14px rgba(245,183,49,0.6)',
          animation: 'playGlow 2.5s ease-in-out infinite',
        }}>
          <Play style={{ width: 14, height: 14, fill: '#1a0e00', color: '#1a0e00', marginLeft: 2 }} />
        </div>
      </div>
    </motion.div>
  )
}

// ── SquareCard — square grid card (Adventure / main sections) ─────────────────
interface SquareCardProps {
  title: string
  coverImg: string | null
  themeBg: string
  duration?: string
  onPlay: () => void
  onLike?: () => void
  index?: number
}

const SquareCard: React.FC<SquareCardProps> = ({ title, coverImg, themeBg, duration, onPlay, onLike, index = 0 }) => {
  const [imgErr, setImgErr] = useState(false)
  const showImg = coverImg && !imgErr

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.88 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.06, duration: 0.32 }}
      whileTap={{ scale: 0.95 }}
      onClick={onPlay}
      className="relative overflow-hidden cursor-pointer"
      style={{
        aspectRatio: '1 / 1',
        borderRadius: 18,
        background: showImg ? '#000' : themeBg,
        boxShadow: '0 10px 30px rgba(16,24,40,0.22)',
        border: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'saturate(120%) blur(4px)',
        minWidth: 0,
      }}
    >
      {showImg && (
        <img src={coverImg!} alt={title} onError={() => setImgErr(true)}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.88 }} />
      )}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to top, rgba(2,6,23,0.82) 0%, rgba(2,6,23,0.28) 55%, rgba(2,6,23,0.06) 100%)',
      }} />

      {/* Heart */}
      <button onClick={e => { e.stopPropagation(); onLike?.() }}
        style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', border: 'none', cursor: 'pointer' }}>
        <Heart style={{ width: 12, height: 12, color: '#fff' }} />
      </button>

      {/* Bottom */}
      <div style={{ position: 'absolute', bottom: 8, left: 9, right: 9, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div style={{ flex: 1, minWidth: 0, paddingRight: 6 }}>
          <p style={{
            color: '#fff', fontWeight: 800, fontSize: 11, lineHeight: 1.3,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {title}
          </p>
          {duration && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'rgba(255,255,255,0.55)', fontSize: 9, fontWeight: 600, marginTop: 3 }}>
              <Clock style={{ width: 8, height: 8 }} />{duration}
            </span>
          )}
        </div>
        {/* Yellow play */}
        <div style={{
          width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg,#F5B731,#D4950A)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 3px 10px rgba(245,183,49,0.55)',
        }}>
          <Play style={{ width: 11, height: 11, fill: '#1a0e00', color: '#1a0e00', marginLeft: 1 }} />
        </div>
      </div>
    </motion.div>
  )
}

// ── SectionHeader ─────────────────────────────────────────────────────────────
const SectionHeader: React.FC<{ title: string; subtitle?: string; onViewAll?: () => void }> = ({ title, subtitle, onViewAll }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', marginBottom: 14 }}>
    <div>
      <h2 style={{ color: '#0b1220', fontWeight: 900, fontSize: 18, lineHeight: 1.2, letterSpacing: '-0.01em' }}>{title}</h2>
      {subtitle && <p style={{ color: '#9CA3AF', fontSize: 11, marginTop: 2 }}>{subtitle}</p>}
    </div>
    {onViewAll && (
      <button onClick={onViewAll} style={{
        display: 'flex', alignItems: 'center', gap: 2,
        fontSize: 12, color: '#6B7280', fontWeight: 600,
        background: 'none', border: 'none', cursor: 'pointer', padding: 0,
      }}>
        View all <ChevronRight style={{ width: 13, height: 13 }} />
      </button>
    )}
  </div>
)

// ── ArrowScrollRow — replaces native overflow-x scroll with < > buttons ──────
interface ArrowScrollRowProps {
  children: React.ReactNode
  gap?: number
  px?: number
  mb?: number
}
const ArrowScrollRow: React.FC<ArrowScrollRowProps> = ({ children, gap = 12, px = 20, mb = 20 }) => {
  const trackRef = useRef<HTMLDivElement>(null)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(false)

  const checkArrows = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    setCanLeft(el.scrollLeft > 4)
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4)
  }, [])

  useEffect(() => {
    const id = setTimeout(checkArrows, 80)
    return () => clearTimeout(id)
  }, [checkArrows, children])

  const scroll = (dir: 1 | -1) => {
    trackRef.current?.scrollBy({ left: dir * 240, behavior: 'smooth' })
    setTimeout(checkArrows, 350)
  }

  const arrowBtn = (side: 'left' | 'right'): React.CSSProperties => ({
    position: 'absolute',
    [side]: 4,
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: 10,
    width: 32, height: 32, borderRadius: '50%',
    background: 'rgba(15,14,35,0.88)',
    backdropFilter: 'blur(10px)',
    border: '1.5px solid rgba(255,255,255,0.15)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 4px 18px rgba(0,0,0,0.32)',
    padding: 0,
  })

  return (
    <div style={{ position: 'relative', marginBottom: mb }}>
      <AnimatePresence>
        {canLeft && (
          <motion.button key="al"
            initial={{ opacity: 0, scale: 0.75 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.75 }}
            transition={{ duration: 0.15 }} onClick={() => scroll(-1)} style={arrowBtn('left')}>
            <ChevronLeft style={{ width: 15, height: 15, color: '#fff' }} />
          </motion.button>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {canRight && (
          <motion.button key="ar"
            initial={{ opacity: 0, scale: 0.75 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.75 }}
            transition={{ duration: 0.15 }} onClick={() => scroll(1)} style={arrowBtn('right')}>
            <ChevronRight style={{ width: 15, height: 15, color: '#fff' }} />
          </motion.button>
        )}
      </AnimatePresence>
      <div ref={trackRef} onScroll={checkArrows}
        style={{ display: 'flex', gap, padding: `0 ${px}px`, overflowX: 'auto', scrollbarWidth: 'none' }}>
        {children}
      </div>
    </div>
  )
}

// ── Home ──────────────────────────────────────────────────────────────────────
export const Home: React.FC = () => {
  const navigate = useNavigate()
  const { activeChild } = useAuth()
  const { setProfileSelected } = useProfileSelection()

  const [userStories,      setUserStories]      = useState<GeneratedStory[]>([])
  const [communityStories, setCommunityStories]  = useState<CommunityStory[]>([])
  const [sydneyStories,    setSydneyStories]     = useState<CommunityStory[]>([])
  const [recommended,      setRecommended]       = useState<CommunityStory[]>([])
  const [loading,          setLoading]           = useState(true)
  const [searchQuery,      setSearchQuery]       = useState('')
  const [activeCategory,   setActiveCategory]    = useState('all')
  const [activeAge,        setActiveAge]         = useState('All')
  const [activeDuration,   setActiveDuration]    = useState<string | null>(null)
  const prevChildId = useRef<string | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    if (!activeChild) return
    setLoading(true)
    const fetchC = (url: string): Promise<CommunityStory[]> =>
      fetch(url).then(r => r.json() as Promise<CommunityStory[]>)
    const [allStories, community, sydney, memory] = await Promise.all([
      loadStories().catch((): GeneratedStory[] => []),
      fetchC('/api/community/stories?limit=20').catch((): CommunityStory[] => []),
      fetchC('/api/community/stories?region=sydney&limit=6').catch((): CommunityStory[] => []),
      getMemoryContext(activeChild.id).catch((): MemoryContext | null => null),
    ])
    const mine = allStories
      .filter(s => s.childName === activeChild.name)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 12)
    setUserStories(mine)
    setCommunityStories(community)
    setSydneyStories(sydney)
    const favThemes: string[] = memory?.favoriteThemes ?? []
    const sorted = favThemes.length > 0
      ? [...community].sort((a, b) => {
          const score = (s: CommunityStory) =>
            favThemes.some((t: string) => s.tags.includes(t) || s.theme === t) ? 1 : 0
          return score(b) - score(a)
        })
      : community
    setRecommended(sorted.slice(0, 8))
    setLoading(false)
  }, [activeChild])

  useEffect(() => {
    if (activeChild?.id !== prevChildId.current) {
      prevChildId.current = activeChild?.id ?? null
      setUserStories([]); setCommunityStories([]); setSydneyStories([]); setRecommended([])
      setSearchQuery(''); setActiveCategory('all'); setActiveAge('All'); setActiveDuration(null)
    }
    load()
  }, [load, activeChild?.id])

  const filterC = (stories: CommunityStory[]) =>
    stories.filter(s => matchesFilter(s, activeCategory) && matchesSearch(s, searchQuery))
  const filterG = (stories: GeneratedStory[]) =>
    stories.filter(s => matchesFilter(s, activeCategory) && matchesSearch(s, searchQuery))

  if (!activeChild) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F3F9]">
        <p style={{ color: '#9CA3AF', fontSize: 14 }}>Select a child in the sidebar to begin.</p>
      </div>
    )
  }

  const editorsPick = filterC(communityStories).slice(0, 8)
  const adventureStories = filterC(communityStories.filter(s => matchesThemes(s, ['adventure']))).slice(0, 8)
  const fantasyStories = filterC(recommended).slice(0, 8)
  const myStories = filterG(userStories)

  return (
    <div className="min-h-screen text-white" style={{ background: '#F4F3F9', position: 'relative' }}>
      <style>{KEYFRAMES}</style>

      {/* ── Sticky Header ──────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40"
        style={{ background: 'rgba(10,9,28,0.97)', backdropFilter: 'blur(28px)', borderBottom: '1px solid rgba(245,183,49,0.10)' }}>

        {/* Top row: greeting + avatar + bell + magic wand */}
        <div className="flex items-center gap-3 px-5 pt-3 pb-2">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => { setProfileSelected(false); navigate('/profiles') }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 rounded-full blur-sm opacity-70"
                style={{ background: activeChild.avatar_color, transform: 'scale(1.5)' }} />
              <div className="relative w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-black z-10 border-2 border-white/20 shadow-lg"
                style={{ background: activeChild.avatar_color }}>
                {activeChild.name[0].toUpperCase()}
              </div>
            </div>
          </motion.button>

          <div className="flex-1 min-w-0">
            <p className="text-amber-300/60 text-[10px] font-bold uppercase tracking-wider">{getGreeting()}</p>
            <h1 className="text-white font-black text-[16px] leading-tight truncate" style={{ letterSpacing: '-0.01em' }}>
              {activeChild.name}! 🌙
            </h1>
          </div>

          {/* Bell */}
          <motion.button whileTap={{ scale: 0.88 }}
            className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 relative"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(255,255,255,0.10)' }}>
            <Bell className="w-4 h-4 text-white/70" />
            {/* Notification dot */}
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-400 border border-[#0a091c]" />
          </motion.button>

          <MagicWand />
        </div>

        {/* Search bar row */}
        <div className="px-5 pb-3">
          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.10)' }}>
            <Search className="w-4 h-4 text-white/35 flex-shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search stories, themes, characters…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 outline-none"
              style={{ fontWeight: 500 }}
            />
            {searchQuery && (
              <motion.button whileTap={{ scale: 0.85 }} onClick={() => setSearchQuery('')}>
                <X className="w-4 h-4 text-white/40" />
              </motion.button>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero Banner ─────────────────────────────────────────────────── */}
      <EmojiHeroBanner
        childName={activeChild.name}
        onExplore={() => navigate('/library')}
        onCreate={() => navigate('/create')}
      />

      {/* ── White content area (pulls over hero bottom) ──────────────────── */}
      <div style={{
        background: 'linear-gradient(180deg,#fbf8ff,#f4f3f9)',
        borderRadius: '28px 28px 0 0',
        marginTop: -28,
        position: 'relative',
        zIndex: 10,
        paddingTop: 24,
        paddingBottom: 80,
        boxShadow: '0 -8px 32px rgba(16,24,40,0.06)',
        borderTop: '1px solid rgba(15,14,35,0.03)'
      }}>

        {/* ── Age filter circles ────────────────────────────────────────── */}
        <ArrowScrollRow gap={16} px={20} mb={20}>
          {AGE_FILTERS.map(({ label, emoji }, idx) => {
            const CIRCLE_GRADIENTS = [
              'linear-gradient(135deg,#1a0533,#6b1fa2,#c2185b)',
              'linear-gradient(135deg,#1a0a2e,#0d47a1,#1565c0)',
              'linear-gradient(135deg,#0a2744,#155e75,#0891b2)',
              'linear-gradient(135deg,#14532d,#166534,#16a34a)',
              'linear-gradient(135deg,#1c1917,#57534e,#78716c)',
              'linear-gradient(135deg,#020617,#1e3a8a,#1d4ed8)',
              'linear-gradient(135deg,#2d1b69,#5b21b6,#7c3aed)',
            ]
            const isActive = activeAge === label
            return (
              <motion.button key={label} whileTap={{ scale: 0.88 }} onClick={() => setActiveAge(label)}
                style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 26,
                  background: CIRCLE_GRADIENTS[idx % CIRCLE_GRADIENTS.length],
                  border: isActive ? '3px solid #F5B731' : '2.5px solid rgba(255,255,255,0.08)',
                  boxShadow: isActive
                    ? '0 0 0 2px rgba(245,183,49,0.25), 0 8px 24px rgba(0,0,0,0.28)'
                    : '0 4px 16px rgba(0,0,0,0.20)',
                  transition: 'all 0.22s ease',
                  position: 'relative',
                }}>
                  {emoji}
                  {isActive && (
                    <span style={{
                      position: 'absolute', bottom: -2, right: -2,
                      width: 18, height: 18, borderRadius: '50%',
                      background: '#F5B731', border: '2px solid #fbf8ff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 9, fontWeight: 900, color: '#1a0e00',
                    }}>✓</span>
                  )}
                </div>
                <span style={{
                  fontSize: 11, fontWeight: isActive ? 800 : 500,
                  color: isActive ? '#D4950A' : '#6B7280',
                  letterSpacing: isActive ? '0.01em' : 0,
                }}>
                  {label}
                </span>
              </motion.button>
            )
          })}
        </ArrowScrollRow>

        {/* ── Category + Duration pills ─────────────────────────────────── */}
        <ArrowScrollRow gap={8} px={20} mb={4}>
          {CATEGORIES.map(cat => (
            <motion.button key={cat.id} whileTap={{ scale: 0.9 }} onClick={() => setActiveCategory(cat.id)}
              style={{
                flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5,
                padding: '9px 16px', borderRadius: 99,
                background: activeCategory === cat.id
                  ? 'linear-gradient(135deg,#0F0E23,#1e1b4b)'
                  : '#FFFFFF',
                border: activeCategory === cat.id ? '2px solid #0F0E23' : '2px solid #EBEBF0',
                color: activeCategory === cat.id ? '#fff' : '#4B5563',
                fontWeight: 700, fontSize: 13,
                cursor: 'pointer',
                boxShadow: activeCategory === cat.id
                  ? '0 4px 14px rgba(15,14,35,0.28)'
                  : '0 2px 6px rgba(0,0,0,0.05)',
                transition: 'all 0.2s ease',
              }}>
              <span style={{ fontSize: 14, lineHeight: 1 }}>{cat.emoji}</span>
              {cat.label}
            </motion.button>
          ))}

          {/* Divider */}
          <div style={{ width: 1, height: 22, background: '#E5E7EB', flexShrink: 0, margin: '0 2px' }} />

          {DURATION_FILTERS.map(d => (
            <motion.button key={d} whileTap={{ scale: 0.9 }} onClick={() => setActiveDuration(v => v === d ? null : d)}
              style={{
                flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5,
                padding: '9px 14px', borderRadius: 99,
                background: activeDuration === d ? 'rgba(245,183,49,0.12)' : '#FFFFFF',
                border: activeDuration === d ? '2px solid #F5B731' : '2px solid #EBEBF0',
                color: activeDuration === d ? '#B45309' : '#6B7280',
                fontWeight: activeDuration === d ? 700 : 500,
                fontSize: 12, cursor: 'pointer',
                boxShadow: activeDuration === d
                  ? '0 3px 10px rgba(245,183,49,0.18)'
                  : '0 1px 4px rgba(0,0,0,0.05)',
                transition: 'all 0.2s ease',
              }}>
              <Clock style={{ width: 11, height: 11 }} />
              {d}
            </motion.button>
          ))}
        </ArrowScrollRow>

        {/* ── Loading shimmer ───────────────────────────────────────────── */}
        {loading && (
          <div style={{ padding: '0 20px' }}>
            <div style={{ height: 20, width: 140, borderRadius: 10, background: '#E5E7EB', marginBottom: 14 }} className="animate-pulse" />
            <div style={{ display: 'flex', gap: 12, marginBottom: 32, overflow: 'hidden' }}>
              {[1,2,3].map(i => (
                <div key={i} style={{ flexShrink: 0, width: 280, height: 160, borderRadius: 18, background: '#E5E7EB' }} className="animate-pulse" />
              ))}
            </div>
            <div style={{ height: 20, width: 120, borderRadius: 10, background: '#E5E7EB', marginBottom: 14 }} className="animate-pulse" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
              {[1,2,3,4].map(i => (
                <div key={i} style={{ aspectRatio: '1/1', borderRadius: 16, background: '#E5E7EB' }} className="animate-pulse" />
              ))}
            </div>
          </div>
        )}

        {!loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }}>

            {/* ── Editor's Pick — landscape cards ──────────────────────── */}
            {editorsPick.length > 0 && (
              <section style={{ marginBottom: 32 }}>
                <SectionHeader title="⭐ Editor's Pick" onViewAll={() => navigate('/library')} />
                <div style={{ display: 'flex', gap: 12, padding: '0 20px 8px', overflowX: 'auto', scrollbarWidth: 'none' }}>
                  {editorsPick.map((s, i) => (
                    <LandscapeCard key={s.id}
                      title={s.title}
                      coverImg={getCardAssets(s).img}
                      themeBg={getCardAssets(s).bg}
                      duration={`${Math.floor(5 + i * 3)} min`}
                      meta={`Age ${s.ageMin}+`}
                      badge={i === 0 ? '⭐ Top Pick' : i === 1 ? '🔥 Hot' : undefined}
                      badgeBg={i === 0 ? '#F5B731' : '#ef4444'}
                      onPlay={() => navigate(`/create?remixFrom=${s.id}&theme=${s.theme}`)}
                      index={i}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* ── My Stories — landscape cards ─────────────────────────── */}
            {myStories.length > 0 && (
              <section style={{ marginBottom: 32 }}>
                <SectionHeader title="🌙 Continue Reading" subtitle={`${activeChild.name}'s stories`} onViewAll={() => navigate('/library')} />
                <div style={{ display: 'flex', gap: 12, padding: '0 20px 8px', overflowX: 'auto', scrollbarWidth: 'none' }}>
                  {myStories.map((s, i) => (
                    <LandscapeCard key={s.id}
                      title={s.title}
                      coverImg={getCardAssets(s).img}
                      themeBg={getCardAssets(s).bg}
                      meta={timeAgo(s.createdAt)}
                      badge={i === 0 ? '✨ New' : undefined}
                      badgeBg="#22c55e"
                      onPlay={() => navigate(`/player/${s.id}`)}
                      index={i}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* ── Adventure — 2-column square grid ─────────────────────── */}
            {adventureStories.length > 0 && (
              <section style={{ marginBottom: 32 }}>
                <SectionHeader title="⚔️ Adventure" subtitle="Bold heroes and daring quests" onViewAll={() => navigate('/library')} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, padding: '0 20px' }}>
                  {adventureStories.slice(0, 4).map((s, i) => (
                    <SquareCard key={s.id}
                      title={s.title}
                      coverImg={getCardAssets(s).img}
                      themeBg={getCardAssets(s).bg}
                      duration={`${7 + i * 2} min`}
                      onPlay={() => navigate(`/create?remixFrom=${s.id}&theme=${s.theme}`)}
                      index={i}
                    />
                  ))}
                </div>
                {adventureStories.length > 4 && (
                  <button onClick={() => navigate('/library')}
                    style={{ display: 'block', width: 'calc(100% - 40px)', margin: '12px 20px 0', padding: '10px', borderRadius: 12, background: '#fff', border: '2px solid #E5E7EB', color: '#6B7280', fontSize: 13, fontWeight: 600, cursor: 'pointer', textAlign: 'center' }}>
                    View all {adventureStories.length} stories <ChevronRight style={{ display: 'inline', width: 13, height: 13 }} />
                  </button>
                )}
              </section>
            )}

            {/* ── Fantasy — landscape cards ─────────────────────────────── */}
            {fantasyStories.length > 0 && (
              <section style={{ marginBottom: 32 }}>
                <SectionHeader title="🧙 Fantasy" subtitle="Magical worlds and enchanted tales" onViewAll={() => navigate('/library')} />
                <div style={{ display: 'flex', gap: 12, padding: '0 20px 8px', overflowX: 'auto', scrollbarWidth: 'none' }}>
                  {fantasyStories.map((s, i) => (
                    <LandscapeCard key={s.id}
                      title={s.title}
                      coverImg={getCardAssets(s).img}
                      themeBg={getCardAssets(s).bg}
                      duration={`${5 + i * 3} min`}
                      meta={`Age ${s.ageMin}+`}
                      badge={i < 2 ? '💛 For You' : undefined}
                      badgeBg="#f59e0b"
                      onPlay={() => navigate(`/create?remixFrom=${s.id}&theme=${s.theme}`)}
                      index={i}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* ── Tonight's Favourites — 2-col grid ────────────────────── */}
            {filterC(communityStories).length > 0 && (
              <section style={{ marginBottom: 32 }}>
                <SectionHeader title="🔥 Tonight's Favourites" subtitle="Most-loved right now" onViewAll={() => navigate('/library')} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, padding: '0 20px' }}>
                  {[...filterC(communityStories)].sort((a, b) => b.viewCount - a.viewCount).slice(0, 4).map((s, i) => (
                    <SquareCard key={s.id}
                      title={s.title}
                      coverImg={getCardAssets(s).img}
                      themeBg={getCardAssets(s).bg}
                      duration={`${(s.viewCount / 1000).toFixed(1)}k reads`}
                      onPlay={() => navigate(`/create?remixFrom=${s.id}&theme=${s.theme}`)}
                      index={i}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* ── Animals & Nature — landscape scroll ───────────────────── */}
            {filterC(communityStories.filter(s => matchesThemes(s, ['animals', 'nature']))).length > 0 && (
              <section style={{ marginBottom: 32 }}>
                <SectionHeader title="🌿 Animals & Nature" onViewAll={() => navigate('/library')} />
                <div style={{ display: 'flex', gap: 12, padding: '0 20px 8px', overflowX: 'auto', scrollbarWidth: 'none' }}>
                  {filterC(communityStories.filter(s => matchesThemes(s, ['animals', 'nature']))).slice(0, 8).map((s, i) => (
                    <LandscapeCard key={s.id} title={s.title} coverImg={getCardAssets(s).img} themeBg={getCardAssets(s).bg}
                      duration={`${7 + i * 2} min`} meta={`Age ${s.ageMin}+`}
                      onPlay={() => navigate(`/create?remixFrom=${s.id}&theme=${s.theme}`)} index={i} />
                  ))}
                </div>
              </section>
            )}

            {/* ── Sydney Adventures — 2-col grid ────────────────────────── */}
            {filterC(sydneyStories).length > 0 && (
              <section style={{ marginBottom: 32 }}>
                <SectionHeader title="🦘 Sydney Adventures" subtitle="Iconic Aussie locations" onViewAll={() => navigate('/library')} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, padding: '0 20px' }}>
                  {filterC(sydneyStories).slice(0, 4).map((s, i) => (
                    <SquareCard key={s.id} title={s.title} coverImg={getCardAssets(s).img} themeBg={getCardAssets(s).bg}
                      duration={`${8 + i * 2} min`}
                      onPlay={() => navigate(`/create?remixFrom=${s.id}&theme=${s.theme}`)} index={i} />
                  ))}
                </div>
              </section>
            )}

          </motion.div>
        )}
      </div>
    </div>
  )
}
