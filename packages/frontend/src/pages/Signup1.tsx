import React from 'react'
import { useNavigate, Link } from 'react-router-dom'

export const Signup1: React.FC = () => {
  const navigate = useNavigate()
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    navigate('/profiles1')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#FFF8FF] to-[#F4F3F9]">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
        <div className="p-10">
          <h2 className="text-2xl font-extrabold">Create account</h2>
          <p className="mt-2 text-sm text-[#6B7280]">Join families building magical bedtime rituals.</p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <input required placeholder="Full name" className="w-full px-4 py-3 rounded-xl border border-gray-200" />
            <input required placeholder="Email" type="email" className="w-full px-4 py-3 rounded-xl border border-gray-200" />
            <input required placeholder="Password" type="password" className="w-full px-4 py-3 rounded-xl border border-gray-200" />
            <button type="submit" className="w-full py-3 rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#06b6d4] text-white font-semibold">Create account</button>
          </form>

          <div className="mt-4 text-sm text-[#6B7280]">Already have an account? <Link to="/login1" className="text-[#7c3aed] font-semibold">Sign in</Link></div>
        </div>

        <div className="hidden md:flex items-center justify-center bg-gradient-to-tr from-[#FDE68A] to-[#FBCFE8] p-6">
          <div className="text-center">
            <img src="https://zxhbmvyyqyjjbijzdbzy.supabase.co/storage/v1/object/public/story-references/scenes/1778157367142-0.png" alt="hero" className="w-56 h-40 object-cover rounded-xl shadow-xl" />
            <div className="mt-4 text-sm text-[#374151]">Create premium, illustrated stories for your child.</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Signup1
