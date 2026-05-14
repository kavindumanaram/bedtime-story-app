import React from 'react'
import { useNavigate } from 'react-router-dom'

const profiles = [
  { id: 'c1', name: 'Tina', age: 4, color: '#FDE68A' },
  { id: 'c2', name: 'Sam', age: 6, color: '#C7E9FF' },
]

export const SelectProfiles1: React.FC = () => {
  const navigate = useNavigate()
  const select = (id: string) => {
    // mock selection
    sessionStorage.setItem('husht_profile_selected', id)
    navigate('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#FFF8FF] to-[#F4F3F9] p-6">
      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-2xl p-8">
        <h2 className="text-2xl font-extrabold">Choose a profile</h2>
        <p className="mt-2 text-sm text-[#6B7280]">Select who is reading tonight.</p>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {profiles.map(p => (
            <button key={p.id} onClick={() => select(p.id)} className="p-6 rounded-2xl bg-gradient-to-tr from-white to-transparent border shadow hover:scale-105 transition flex items-center gap-4">
              <div style={{ width: 64, height: 64, borderRadius: 16, background: p.color }} />
              <div>
                <div className="font-semibold text-lg">{p.name}</div>
                <div className="text-sm text-[#6B7280]">Age {p.age}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default SelectProfiles1
