import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

function Profile() {
  const [profile, setProfile] = useState(null)
  const [location, setLocation] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [])

  async function fetchProfile() {
    setIsLoading(true)
    setErrorMessage('')
    setSuccessMessage('')

    const {
      data: userData,
      error: userError,
    } = await supabase.auth.getUser()

    const user = userData?.user

    if (userError || !user) {
      setErrorMessage(
        'Unable to load your account.'
      )
      setIsLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('profiles')
      .select(`
        full_name,
        email,
        role,
        franchise_name,
        franchise_package,
        marketing_drive_link,
        department,
        location
      `)
      .eq('id', user.id)
      .single()

    if (error) {
      console.error(
        'Error loading profile:',
        error
      )

      setErrorMessage(error.message)
      setIsLoading(false)
      return
    }

    setProfile(data)
    setLocation(data?.location || '')
    setIsLoading(false)
  }

  async function saveLocation() {
    setErrorMessage('')
    setSuccessMessage('')

    if (!location.trim()) {
      setErrorMessage(
        'Please enter your franchise location.'
      )
      return
    }

    setIsSaving(true)

    try {
      const {
        data: userData,
        error: userError,
      } = await supabase.auth.getUser()

      const user = userData?.user

      if (userError || !user) {
        setErrorMessage(
          'Unable to verify your account.'
        )
        return
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          location: location.trim(),
        })
        .eq('id', user.id)

      if (error) {
        console.error(
          'Error updating location:',
          error
        )

        setErrorMessage(error.message)
        return
      }

      setProfile((currentProfile) => ({
        ...currentProfile,
        location: location.trim(),
      }))

      setSuccessMessage(
        'Location updated successfully.'
      )
    } catch (error) {
      console.error(
        'Unexpected profile update error:',
        error
      )

      setErrorMessage(
        'An unexpected error occurred while updating your location.'
      )
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="page-header">
        <h1>Profile</h1>
        <p>Loading your account information...</p>
      </div>
    )
  }

  return (
    <>
      <div className="page-header">
        <h1>Profile</h1>

        <p>
          View and update your account and franchise
          information.
        </p>
      </div>

      {successMessage && (
        <div className="success-message">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="error-message">
          {errorMessage}
        </div>
      )}

      {profile && (
        <div className="profile-card">
          <div className="profile-row">
            <strong>Full Name</strong>

            <span>
              {profile.full_name || 'Not provided'}
            </span>
          </div>

          <div className="profile-row">
            <strong>Email Address</strong>

            <span>
              {profile.email || 'Not provided'}
            </span>
          </div>

          <div className="profile-row">
            <strong>Role</strong>

            <span>
              {profile.role || 'Not provided'}
            </span>
          </div>

          {profile.role === 'franchisee' ? (
            <>
              <div className="profile-row">
                <strong>Franchise Name</strong>

                <span>
                  {profile.franchise_name ||
                    'Not provided'}
                </span>
              </div>

              <div className="profile-row">
                <strong>Franchise Package</strong>

                <span>
                  {profile.franchise_package ||
                    'Not provided'}
                </span>
              </div>

              <div className="profile-row profile-edit-row">
                <strong>Franchise Location</strong>

                <div className="profile-edit-field">
                  <input
                    type="text"
                    placeholder="Enter your franchise location"
                    value={location}
                    onChange={(event) => {
                      setLocation(event.target.value)
                    }}
                    disabled={isSaving}
                  />

                  <button
                    type="button"
                    onClick={saveLocation}
                    disabled={isSaving}
                  >
                    {isSaving
                      ? 'Saving...'
                      : 'Save Location'}
                  </button>
                </div>
              </div>

              <div className="profile-row">
                <strong>Marketing Library</strong>

                <span>
                  {profile.marketing_drive_link
                    ? 'Assigned'
                    : 'Not assigned'}
                </span>
              </div>
            </>
          ) : (
            <div className="profile-row">
              <strong>Department</strong>

              <span>
                {profile.department ||
                  'Not provided'}
              </span>
            </div>
          )}
        </div>
      )}
    </>
  )
}

export default Profile