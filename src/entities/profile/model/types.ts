export interface UserProfile {
  displayName: string
  avatarInitials: string
  email?: string
}

export const DEFAULT_PROFILE: UserProfile = {
  displayName: 'You',
  avatarInitials: 'Y',
  email: 'hello@finance.app',
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'Y'
  const first = parts[0]![0]!
  const last = parts.length > 1 ? parts[parts.length - 1]![0]! : ''
  return (first + last).toUpperCase()
}