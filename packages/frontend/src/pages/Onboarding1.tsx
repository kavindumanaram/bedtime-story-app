import React from 'react'
import { useNavigate } from 'react-router-dom'

export const Onboarding1: React.FC = () => {
  const navigate = useNavigate()
  const onFinish = () => navigate('/profiles1')

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#FFF8FF] to-[#F4F3F9] p-6">
      <div className="max-w-3xl w-full bg-white rounded-3xl shadow-2xl p-8">
        <h2 className="text-2xl font-extrabold">Get started</h2>
        <p className="mt-3 text-sm text-[#6B7280]">A few quick steps to set up your family and child profiles.</p>

        <div className="mt-6 space-y-4">
          <label className="flex items-start gap-3">
            <input type="checkbox" className="mt-1" />
            <div>
              <div className="font-semibold">GDPR consent</div>
              <div className="text-sm text-[#6B7280]">I agree to share minimal profile data for personalization.</div>
            </div>
          </label>

          <label className="flex items-start gap-3">
            <input type="checkbox" className="mt-1" />
            <div>
              <div className="font-semibold">Allow story suggestions</div>
              <div className="text-sm text-[#6B7280]">Enable community picks and premium recommendations.</div>
            </div>
          </label>

          <div className="mt-6 flex justify-end">
            <button onClick={onFinish} className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#06b6d4] text-white">Finish</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Onboarding1
