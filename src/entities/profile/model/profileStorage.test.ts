// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { isUserProfile, readProfile, writeProfile } from './profileStorage'
import { DEFAULT_PROFILE } from './types'
import type { UserProfile } from './types'

beforeEach(() => localStorage.clear())
afterEach(() => localStorage.clear())

describe('profileStorage', () => {
  it('falls back to the default profile when nothing is stored', () => {
    expect(readProfile()).toEqual(DEFAULT_PROFILE)
  })

  it('round-trips a stored profile', () => {
    const profile: UserProfile = { displayName: 'Alice', avatarInitials: 'A' }
    writeProfile(profile)
    expect(readProfile()).toEqual(profile)
  })

  it('ignores corrupted storage', () => {
    localStorage.setItem('finance-analyzer.profile', '{not json')
    expect(readProfile()).toEqual(DEFAULT_PROFILE)
  })

  it('rejects malformed shapes in isUserProfile', () => {
    expect(isUserProfile({ displayName: 'x' })).toBe(false)
    expect(isUserProfile({ displayName: 'x', avatarInitials: 42 })).toBe(false)
    expect(isUserProfile({ displayName: 'x', avatarInitials: 'X' })).toBe(true)
  })
})