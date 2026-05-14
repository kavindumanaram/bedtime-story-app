import React, { createContext, useContext, useState } from 'react'

interface ProfileSelectionContextValue {
  profileSelected: boolean
  setProfileSelected: (v: boolean) => void
}

const ProfileSelectionContext = createContext<ProfileSelectionContextValue | null>(null)

export function ProfileSelectionProvider({ children }: { children: React.ReactNode }) {
  const [profileSelected, setProfileSelectedState] = useState<boolean>(
    () => sessionStorage.getItem('husht_profile_selected') === 'true'
  )

  const setProfileSelected = (v: boolean) => {
    if (v) sessionStorage.setItem('husht_profile_selected', 'true')
    else sessionStorage.removeItem('husht_profile_selected')
    setProfileSelectedState(v)
  }

  return (
    <ProfileSelectionContext.Provider value={{ profileSelected, setProfileSelected }}>
      {children}
    </ProfileSelectionContext.Provider>
  )
}

export function useProfileSelection(): ProfileSelectionContextValue {
  const ctx = useContext(ProfileSelectionContext)
  if (!ctx) throw new Error('useProfileSelection must be used inside ProfileSelectionProvider')
  return ctx
}
