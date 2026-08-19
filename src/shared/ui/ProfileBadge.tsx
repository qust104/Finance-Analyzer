import './ProfileBadge.css'

interface ProfileBadgeProps {
  displayName: string
  avatarInitials: string
  compact?: boolean
}

export function ProfileBadge({ displayName, avatarInitials, compact = false }: ProfileBadgeProps) {
  return (
    <span className={`profile-badge${compact ? ' profile-badge--compact' : ''}`}>
      <span className="profile-badge__avatar" aria-hidden="true">
        {avatarInitials}
      </span>
      <span className="profile-badge__name">{displayName}</span>
    </span>
  )
}