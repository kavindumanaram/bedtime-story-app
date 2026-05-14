import React, { useRef, useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Play, GitBranch, Trash2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { loadStories, deleteStory, type GeneratedStory } from '../api/storyDb'
import type { CommunityStory } from '@bedtime/shared'
import { usePlayer } from '../contexts/PlayerContext'

const FALLBACK_IMAGE =
  'https://zxhbmvyyqyjjbijzdbzy.supabase.co/storage/v1/object/public/story-references/scenes/1778157367142-0.png'

// ── unified card shape ────────────────────────────────────────────────────────

interface StoryItem {
  id: string
  title: string
  subtitle: string
  img: string | null
  gradient: string
  badge: string
  isBranching?: boolean
  onPlay: () => void
  onDelete?: () => void
}

function userToItem(s: GeneratedStory, index: number, openPlayer: (id: string) => void, onDelete: () => void): StoryItem {
  return {
    id: s.id,
    title: s.title,
    subtitle: s.theme || s.childName || 'Your story',
    img: s.coverImage || s.images?.[0] || null,
    gradient: 'linear-gradient(135deg,#7c3aed,#06b6d4)',
    badge: index === 0 ? 'Recently added' : index === 1 ? 'Continue reading' : '',
    isBranching: s.is_branching,
    onPlay: () => openPlayer(s.id),
    onDelete,
  }
}

function communityToItem(s: CommunityStory, index: number, navigate: (to: string) => void): StoryItem {
  return {
    id: s.id,
    title: s.title,
    subtitle: s.theme,
    img: null,
    gradient: s.coverGradient,
    badge: index === 0 ? 'Your favorite' : index === 1 ? 'Recently added' : 'Saved',
    onPlay: () => navigate(`/create?remixFrom=${s.id}&theme=${encodeURIComponent(s.theme)}`),
  }
}

// ── CardWithActions — wraps a story card with delete + branching badge ────────

function CardWithActions({ item, idx }: { item: StoryItem; idx: number }) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <div className="relative w-full h-[420px] overflow-hidden rounded-2xl shadow-lg" style={{ background: item.gradient }}>
      {item.img ? (
        <img src={item.img} alt={item.title} className="w-full h-full object-cover" />
      ) : null}

      <div className="absolute left-0 right-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-white/80 capitalize">{item.subtitle}</div>
            <div className="mt-1 font-extrabold text-xl">{item.title}</div>
          </div>
          <div>
            <button className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-[#7c3aed] to-[#06b6d4] text-white shadow-lg">
              <Play className="w-4 h-4" />Listen
            </button>
          </div>
        </div>
      </div>

      {/* top-left: badge + branching indicator */}
      <div className="absolute top-4 left-4 flex items-center gap-2">
        <div
          className="px-3 py-1 rounded-full text-xs font-semibold text-white"
          style={{ background: idx % 3 === 0 ? 'linear-gradient(90deg,#f97316,#f59e0b)' : 'linear-gradient(90deg,#7c3aed,#06b6d4)' }}
        >
          {item.badge || (idx === 0 ? 'Your favorite' : idx === 1 ? 'Recently added' : 'Saved')}
        </div>
        {item.isBranching && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold text-white bg-amber-500/90">
            <GitBranch className="w-3 h-3" />
            Interactive
          </div>
        )}
      </div>

      {/* top-right: delete (only for user stories) */}
      {item.onDelete && (
        <button
          onClick={e => {
            e.stopPropagation()
            if (confirmDelete) { item.onDelete!() }
            else setConfirmDelete(true)
          }}
          onMouseLeave={() => setConfirmDelete(false)}
          className={`absolute top-4 right-4 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold transition-colors ${
            confirmDelete ? 'bg-red-500 text-white' : 'bg-black/40 text-white hover:bg-red-500/80'
          }`}
        >
          <Trash2 className="w-3 h-3" />
          {confirmDelete ? 'Confirm' : 'Delete'}
        </button>
      )}
    </div>
  )
}

// ── page ─────────────────────────────────────────────────────────────────────

export const Index2: React.FC = () => {
  const { activeChild } = useAuth()
  const navigate = useNavigate()
  const { openPlayer } = usePlayer()
  const childName = activeChild?.name || 'Little Reader'

  const [mouse, setMouse] = useState({ x: 0, y: 0 })
  const heroRef = useRef<HTMLDivElement | null>(null)

  const [userStories, setUserStories] = useState<GeneratedStory[]>([])
  const [communityStories, setCommunityStories] = useState<CommunityStory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const el = heroRef.current
    if (!el) return
    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width - 0.5
      const y = (e.clientY - rect.top) / rect.height - 0.5
      setMouse({ x, y })
    }
    el.addEventListener('mousemove', onMove)
    return () => el.removeEventListener('mousemove', onMove)
  }, [])

  const load = useCallback(async () => {
    if (!activeChild) return
    setLoading(true)
    const [all, community] = await Promise.all([
      loadStories().catch((): GeneratedStory[] => []),
      fetch('/api/community/stories?limit=20')
        .then(r => r.json() as Promise<CommunityStory[]>)
        .catch((): CommunityStory[] => []),
    ])
    const mine = all
      .filter(s => s.childName === activeChild.name)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
    setUserStories(mine)
    setCommunityStories(community)
    setLoading(false)
  }, [activeChild])

  useEffect(() => { load() }, [load])

  async function handleDeleteUserStory(id: string) {
    await deleteStory(id)
    setUserStories(prev => prev.filter(s => s.id !== id))
  }

  // Merge: user stories first, then community as fill
  const items: StoryItem[] = [
    ...userStories.map((s, i) => userToItem(s, i, openPlayer, () => handleDeleteUserStory(s.id))),
    ...communityStories.map((s, i) => communityToItem(s, i, navigate)),
  ]

  const heroImg =
    (userStories[0]?.coverImage || userStories[0]?.images?.[0]) ?? FALLBACK_IMAGE

  const heroTitle = userStories[0]?.title || 'Tonight: The Star Lantern'
  const heroOnClick = userStories[0]
    ? () => openPlayer(userStories[0].id)
    : () => navigate('/create')

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF8FF] via-[#F6FBFF] to-[#F4F3F9]">
      <header className="relative overflow-hidden rounded-b-3xl">
        {/* soft glowing background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-[#FFE6FB] via-transparent to-transparent opacity-60 pointer-events-none" />

        <div ref={heroRef} className="max-w-7xl mx-auto px-6 py-24 lg:py-36 relative z-10">
          <div className="flex flex-col-reverse lg:flex-row items-center justify-between gap-8">
            <div className="w-full lg:w-1/2">
              <h1 className="text-5xl lg:text-7xl font-extrabold text-[#0b1220] leading-tight">Welcome back, {childName}</h1>
              <p className="mt-4 text-xl text-[#374151] max-w-2xl">A cinematic collection of community stories and premium tales — curated for bedtime magic and shared rituals.</p>

              <div className="mt-6 flex items-center gap-3">
                <Link to="/library" className="inline-flex items-center gap-3 px-6 py-4 rounded-3xl bg-gradient-to-r from-[#7c3aed] to-[#06b6d4] text-white shadow-2xl transform hover:scale-[1.03] transition">
                  <Play className="w-5 h-5 opacity-90" />
                  <span className="font-semibold text-lg">Explore stories</span>
                </Link>
                <Link to="/create" className="inline-flex items-center gap-2 px-5 py-4 rounded-3xl bg-white border border-transparent shadow-sm hover:shadow-md transition">Create your story</Link>
              </div>
            </div>

            {/* Hero image with richer treatment */}
            <div className="w-full lg:w-1/2 flex justify-center">
              <div
                onClick={heroOnClick}
                className="relative w-[520px] h-[340px] rounded-3xl shadow-2xl overflow-hidden transform transition-transform cursor-pointer"
                style={{ transform: `perspective(900px) rotateX(${mouse.y * 6}deg) rotateY(${mouse.x * 10}deg)` }}
              >
                <img src={heroImg} alt="hero" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent mix-blend-multiply" />
                <div className="absolute left-6 bottom-6 text-left text-white z-20">
                  <div className="text-sm uppercase tracking-wide bg-black/40 inline-block px-3 py-1 rounded-lg">
                    {userStories[0] ? 'Continue reading' : 'Featured'}
                  </div>
                  <h3 className="mt-3 text-2xl lg:text-4xl font-extrabold">{heroTitle}</h3>
                  <p className="mt-2 text-sm lg:text-base max-w-lg">
                    {userStories[0]?.summary || 'A short cinematic tale with soft illustrations and a soothing narrator — perfect for bedtime.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute -bottom-8 left-1/2 transform -translate-x-1/2 w-[120%] h-24 bg-gradient-to-t from-white to-transparent opacity-80" />
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">

        {/* ── Community Picks ───────────────────────────────────────────── */}
        <section>
          <div className="flex items-baseline justify-between">
            <h2 className="text-3xl font-extrabold text-[#0b1220] mb-4">
              {userStories.length > 0 ? 'Your Stories & Community Picks' : 'Community Picks'}
            </h2>
            <div className="text-sm text-[#6B7280]">Hand-picked by families</div>
          </div>

          {loading ? (
            <div className="flex gap-6 overflow-hidden pb-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex-shrink-0 w-96 h-[420px] rounded-2xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="flex overflow-x-auto pb-6 -mx-2 scrollbar-hide">
              {items.map((item, idx) => (
                <article
                  key={item.id}
                  onClick={item.onPlay}
                  className={`flex-shrink-0 ${idx < 3 ? 'w-96' : 'w-80'} mr-6 rounded-2xl overflow-hidden transform hover:scale-105 transition duration-350 relative cursor-pointer`}
                >
                  <CardWithActions item={item} idx={idx} />
                </article>
              ))}
            </div>
          )}
        </section>

        {/* ── Premium Spotlight ─────────────────────────────────────────── */}
        <section className="mt-12">
          <div className="flex items-baseline justify-between">
            <h2 className="text-3xl font-extrabold text-[#0b1220] mb-4">Premium Spotlight</h2>
            <div className="text-sm text-[#6B7280]">Upgrade for full illustrated scenes</div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="rounded-3xl h-72 bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  onClick={item.onPlay}
                  className="relative rounded-3xl p-4 shadow-2xl bg-white/80 backdrop-blur-sm border border-white/60 hover:shadow-2xl transition cursor-pointer hover:scale-[1.02] duration-300"
                >
                  <div className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-[#f97316] to-[#f59e0b]">Premium</div>
                  <div className="h-64 overflow-hidden rounded-xl" style={{ background: item.gradient }}>
                    {item.img ? (
                      <img src={item.img} alt={item.title} className="w-full h-full object-cover transform hover:scale-105 transition duration-500" />
                    ) : null}
                  </div>
                  <div className="mt-4">
                    <div className="text-sm text-[#6B7280] capitalize">{item.subtitle}</div>
                    <div className="mt-2 font-extrabold text-2xl text-[#0b1220]">{item.title}</div>
                    <p className="mt-3 text-[#6B7280]">A richly illustrated, cinematic tale crafted for deep listening and shared bedtime rituals.</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── More to Explore ───────────────────────────────────────────── */}
        <section className="mt-12">
          <h2 className="text-2xl font-extrabold text-[#0b1220] mb-4">More to Explore</h2>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-xl h-44 bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {items.map((item, idx) => (
                <div
                  key={item.id}
                  onClick={item.onPlay}
                  className="block rounded-xl overflow-hidden bg-white shadow-lg hover:shadow-2xl transition cursor-pointer hover:scale-[1.02] duration-300"
                >
                  <div className="relative h-44 overflow-hidden" style={{ background: item.gradient }}>
                    {item.img ? (
                      <img src={item.img} alt={item.title} className="w-full h-full object-cover transform hover:scale-105 transition duration-500" />
                    ) : null}
                    <div className="absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-semibold text-white" style={{ background: 'rgba(0,0,0,0.35)' }}>
                      {idx % 3 === 0 ? "Editor's pick" : 'New'}
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="font-semibold text-sm text-[#0b1220] truncate">{item.title}</div>
                    <div className="text-xs text-[#9CA3AF] mt-1 capitalize">{item.subtitle}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default Index2
