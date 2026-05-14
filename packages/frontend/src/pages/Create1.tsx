import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export const Create1: React.FC = () => {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [theme, setTheme] = useState('')
  const [age, setAge] = useState(4)
  const [creating, setCreating] = useState(false)

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    // Mock create: simulate delay then navigate to the created story preview
    await new Promise((r) => setTimeout(r, 900))
    const id = `local-${Date.now()}`
    setCreating(false)
    // In real app, POST to API then navigate to the created story
    navigate(`/player1/${id}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF8FF] to-[#F4F3F9] flex items-center justify-center p-6">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl p-8">
        <h2 className="text-2xl font-extrabold">Create a story</h2>
        <p className="mt-2 text-sm text-[#6B7280]">Craft a short bedtime tale — add title, theme and target age, then generate.</p>

        <form onSubmit={onCreate} className="mt-6 space-y-4">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Story title" className="w-full px-4 py-3 rounded-xl border border-gray-200" />
          <input value={theme} onChange={(e) => setTheme(e.target.value)} placeholder="Theme (e.g., forest, moon, kindness)" className="w-full px-4 py-3 rounded-xl border border-gray-200" />
          <div className="flex items-center gap-4">
            <label className="text-sm">Age</label>
            <select value={age} onChange={(e) => setAge(Number(e.target.value))} className="px-3 py-2 rounded-md border">
              <option value={3}>3</option>
              <option value={4}>4</option>
              <option value={5}>5</option>
              <option value={6}>6</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <button type="submit" disabled={creating} className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#7c3aed] to-[#06b6d4] text-white">{creating ? 'Creating...' : 'Generate story'}</button>
            <button type="button" onClick={() => navigate(-1)} className="px-4 py-3 rounded-2xl bg-white border">Cancel</button>
          </div>
        </form>

        <div className="mt-6 text-sm text-[#6B7280]">This is a local mock — in production the story is generated server-side and saved to your library.</div>
      </div>
    </div>
  )
}

export default Create1
