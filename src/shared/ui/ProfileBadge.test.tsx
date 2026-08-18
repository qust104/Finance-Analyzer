// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { ProfileBadge } from './ProfileBadge'
import { initialsOf } from '../../entities/profile/model/types'

afterEach(cleanup)

describe('ProfileBadge', () => {
  it('shows the avatar initials and display name', () => {
    render(<ProfileBadge displayName="Alice Smith" avatarInitials="AS" />)
    expect(screen.getByText('Alice Smith')).toBeInTheDocument()
    expect(screen.getByText('AS')).toBeInTheDocument()
  })

  it('renders the compact variant', () => {
    render(<ProfileBadge displayName="You" avatarInitials="Y" compact />)
    expect(screen.getByText('You')).toBeInTheDocument()
  })
})

describe('initialsOf', () => {
  it('derives initials from a full name', () => {
    expect(initialsOf('Alice Smith')).toBe('AS')
  })

  it('uses a single letter for one-word names', () => {
    expect(initialsOf('Bob')).toBe('B')
  })

  it('falls back for empty input', () => {
    expect(initialsOf('   ')).toBe('Y')
  })
})