import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Play } from 'lucide-react'

const sample = Array.from({ length: 8 }).map((_, i) => ({
  id: `mystory-${i}`,
  title: ['My First Tale', 'Forest Nap', 'Tiny Explorer', 'Star Bakery', 'Moonlight Ride', 'Soft Shadows', 'Pebble Path', 'Pocket Dragon'][i % 8],
  img: 'https://zxhbmvyyqyjjbijzdbzy.supabase.co/storage/v1/object/public/story-references/scenes/1778157367142-0.png',
}))

export const Library1: React.FC = () => {
  const { activeChild } = useAuth()
  const childName = activeChild?.name || 'Friend'

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF8FF] via-[#F6FBFF] to-[#F4F3F9]">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold">{childName}'s Stories</h1>
            <p className="text-sm text-[#6B7280] mt-1">All stories created for {childName} — tap to play or continue.</p>
          </div>
          <Link to="/create" className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#06b6d4] text-white">Create</Link>
        </div>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-8">
          {sample.map((s, idx) => (
            <article key={s.id} className="rounded-3xl bg-white/80 backdrop-blur-sm shadow-2xl overflow-hidden transform hover:scale-105 transition duration-300">
              <div className="relative h-64 overflow-hidden">
                <img src={s.img} alt={s.title} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
                <div className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-semibold text-white" style={{ background: idx % 3 === 0 ? 'linear-gradient(90deg,#f97316,#f59e0b)' : 'linear-gradient(90deg,#7c3aed,#06b6d4)' }}>{idx===0? 'Your favorite' : idx===1 ? 'Recently added' : 'Saved'}</div>
                <div className="absolute right-4 bottom-4">
                  <button className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-[#7c3aed] to-[#06b6d4] text-white shadow-lg"> <Play className="w-4 h-4" />Listen</button>
                </div>
              </div>
              <div className="p-5">
                <div className="font-bold text-xl text-[#0b1220] truncate">{s.title}</div>
                <div className="text-sm text-[#6B7280] mt-2">Short description or notes about this story to make it feel personal and warm.</div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-xs text-[#9CA3AF]">Age 3+</div>
                  <div className="text-xs text-[#9CA3AF]">12m</div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Library1
