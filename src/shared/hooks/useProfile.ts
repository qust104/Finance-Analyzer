import { useCallback, useState } from 'react'
import { readProfile, writeProfile } from '../../entities/profile/model/profileStorage'
import type { UserProfile } from '../../entities/profile/model/types'

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile>(() => readProfile())

  const updateProfile = useCallback((next: UserProfile) => {
    writeProfile(next)
    setProfile(next)
  }, [])

  return { profile, updateProfile }
}