import React from 'react'
import { Link } from 'react-router-dom'

export const TempMenu: React.FC = () => {
  return (
    <div style={{ position: 'fixed', right: 16, bottom: 16, zIndex: 60 }}>
      <div className="flex flex-col gap-2">
        <Link to="/index2" className="px-3 py-2 rounded-lg bg-white shadow">Index2</Link>
        <Link to="/library1" className="px-3 py-2 rounded-lg bg-white shadow">Library1</Link>
        <Link to="/login1" className="px-3 py-2 rounded-lg bg-white shadow">Login1</Link>
        <Link to="/signup1" className="px-3 py-2 rounded-lg bg-white shadow">Signup1</Link>
        <Link to="/onboarding1" className="px-3 py-2 rounded-lg bg-white shadow">Onboarding1</Link>
        <Link to="/profiles1" className="px-3 py-2 rounded-lg bg-white shadow">Profiles1</Link>
        <Link to="/player1/preview" className="px-3 py-2 rounded-lg bg-white shadow">Player1</Link>
      </div>
    </div>
  )
}

export default TempMenu
