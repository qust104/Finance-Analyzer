import './ProfileBadge.css'

interface ProfileBadgeProps {
  displayName: string
  avatarInitials: string
  email?: string
  compact?: boolean
  hideName?: boolean
}

export function ProfileBadge({
  displayName,
  avatarInitials,
  email,
  compact = false,
  hideName = false,
}: ProfileBadgeProps) {
  return (
    <span className={`profile-badge${compact ? ' profile-badge--compact' : ''}`}>
      <span className="profile-badge__avatar" aria-hidden="true">
        {avatarInitials}
      </span>
      {!hideName && (
        <span className="profile-badge__meta">
          <span className="profile-badge__name">{displayName}</span>
          {email && <span className="profile-badge__email">{email}</span>}
        </span>
      )}
    </span>
  )
}