import { useState } from 'react'
import { initialsOf } from '../../entities/profile/model/types'
import { useProfile } from '../../shared/hooks/useProfile'

// Local profile card for the Settings page: a display name and the
// avatar initials shown in the header and sidebar. Purely on-device.
export function ProfileCard() {
  const { profile, updateProfile } = useProfile()
  const [displayName, setDisplayName] = useState(profile.displayName)
  const [saved, setSaved] = useState(false)

  const trimmed = displayName.trim()
  const nextInitials = initialsOf(trimmed === '' ? 'You' : trimmed)
  const dirty = profile.displayName !== displayName

  const handleSave = () => {
    updateProfile({ displayName: trimmed === '' ? 'You' : trimmed, avatarInitials: nextInitials })
    setSaved(true)
  }

  return (
    <div className="settings-card">
      <h2 className="settings-card__title">Profile</h2>
      <p className="settings-card__hint">
        Your name and avatar initials shown in the header and sidebar. Stored only on this device.
      </p>

      <div className="settings-actions">
        <label className="settings-field">
          <span className="settings-field__label">Display name</span>
          <input
            type="text"
            className="settings-field__input"
            value={displayName}
            maxLength={40}
            onChange={(event) => {
              setDisplayName(event.target.value)
              setSaved(false)
            }}
          />
        </label>
        <div className="settings-actions__row">
          <button
            type="button"
            className="settings-actions__button"
            onClick={handleSave}
            disabled={!dirty}
          >
            Save profile
          </button>
          {saved && (
            <p role="status" className="settings-message settings-message--success">
              Profile saved.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}