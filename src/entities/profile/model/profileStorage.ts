import { DEFAULT_PROFILE } from './types'
import type { UserProfile } from './types'

export const PROFILE_STORAGE_KEY = 'finance-analyzer.profile'

export function isUserProfile(value: unknown): value is UserProfile {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Partial<UserProfile>
  return typeof candidate.displayName === 'string' && typeof candidate.avatarInitials === 'string'
}

export function readProfile(): UserProfile {
  try {
    const stored = localStorage.getItem(PROFILE_STORAGE_KEY)
    if (stored === null) return DEFAULT_PROFILE
    const parsed: unknown = JSON.parse(stored)
    return isUserProfile(parsed) ? parsed : DEFAULT_PROFILE
  } catch {
    return DEFAULT_PROFILE
  }
}

export function writeProfile(profile: UserProfile): void {
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile))
}