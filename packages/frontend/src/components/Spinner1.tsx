import React from 'react'

interface Spinner1Props {
  dark?: boolean
  message?: string
}

export const Spinner1: React.FC<Spinner1Props> = ({ dark = false, message }) => {
  if (dark) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center"
        style={{ background: 'linear-gradient(135deg,#0f0e23,#1a1535,#0d1117)', zIndex: 50 }}>
        {/* Glow orb */}
        <div style={{
          position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)',
          width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle,rgba(124,58,237,0.25) 0%,transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Spinner ring */}
        <div className="relative mb-8">
          <div className="w-24 h-24 rounded-full"
            style={{ border: '3px solid rgba(255,255,255,0.08)' }} />
          <div className="absolute inset-0 w-24 h-24 rounded-full animate-spin"
            style={{ border: '3px solid transparent', borderTopColor: '#7c3aed', borderRightColor: '#06b6d4' }} />
          {/* Inner pulse */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full animate-pulse"
              style={{ background: 'linear-gradient(135deg,rgba(124,58,237,0.5),rgba(6,182,212,0.5))' }} />
          </div>
        </div>

        {/* Brand */}
        <p className="text-white font-black text-xl mb-2" style={{ letterSpacing: '-0.01em' }}>
          <span style={{ color: '#F5B731' }}>Hush</span>Tales
        </p>
        {message && (
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>{message}</p>
        )}

        {/* Twinkle dots */}
        {[0,1,2,3,4].map(i => (
          <div key={i} style={{
            position: 'absolute',
            top: `${15 + i * 14}%`, left: `${10 + ((i * 17) % 75)}%`,
            width: 3, height: 3, borderRadius: '50%',
            background: i % 2 === 0 ? '#c4b5fd' : '#67e8f9',
            animation: `twinkle1 ${1.6 + i * 0.4}s ease-in-out ${i * 0.35}s infinite`,
            pointerEvents: 'none',
          }} />
        ))}

        <style>{`
          @keyframes twinkle1 {
            0%,100% { opacity:0.12; transform:scale(0.6); }
            50%      { opacity:0.9;  transform:scale(1.3); }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm" style={{ zIndex: 50 }}>
      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#7c3aed] to-[#06b6d4] flex items-center justify-center shadow-lg animate-pulse">
        <div className="w-12 h-12 bg-white rounded-full" />
      </div>
    </div>
  )
}

export default Spinner1
