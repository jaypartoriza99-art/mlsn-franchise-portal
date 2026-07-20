import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

function AdminAnnouncements({ onBack }) {
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [announcements, setAnnouncements] = useState([])

  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isPosting, setIsPosting] = useState(false)

  useEffect(() => {
    fetchAnnouncements()

    const channel = supabase
      .channel(`admin-announcements-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'announcements',
        },
        () => {
          fetchAnnouncements()
        }
      )
      .subscribe((status, error) => {
        console.log(
          'Admin announcements realtime status:',
          status
        )

        if (error) {
          console.error(
            'Admin announcements realtime error:',
            error
          )
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function fetchAnnouncements() {
    setErrorMessage('')

    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', {
        ascending: false,
      })

    if (error) {
      console.error(
        'Error loading announcements:',
        error
      )
      setErrorMessage(error.message)
      return
    }

    setAnnouncements(data || [])
  }

  async function handlePostAnnouncement() {
    setErrorMessage('')
    setSuccessMessage('')

    if (!title.trim() || !message.trim()) {
      setErrorMessage(
        'Please complete the title and message.'
      )
      return
    }

    setIsPosting(true)

    try {
      const { data: userData, error: userError } =
        await supabase.auth.getUser()

      const user = userData?.user

      if (userError || !user) {
        setErrorMessage(
          'Unable to determine your account.'
        )
        return
      }

      const { error } = await supabase
        .from('announcements')
        .insert([
          {
            title: title.trim(),
            message: message.trim(),
            created_by: user.id,
          },
        ])

      if (error) {
        console.error(
          'Error posting announcement:',
          error
        )
        setErrorMessage(error.message)
        return
      }

      setSuccessMessage(
        'Announcement posted successfully.'
      )

      setTitle('')
      setMessage('')

      await fetchAnnouncements()
    } finally {
      setIsPosting(false)
    }
  }

  return (
    <>
      <div className="page-header">
        <h1>Announcement Management</h1>

        <p>
          Create announcements for all franchisees.
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

      <div className="concern-form">
        <label>Title</label>

        <input
          value={title}
          onChange={(event) =>
            setTitle(event.target.value)
          }
          placeholder="Announcement title"
          disabled={isPosting}
        />

        <label>Message</label>

        <textarea
          value={message}
          onChange={(event) =>
            setMessage(event.target.value)
          }
          placeholder="Announcement message"
          disabled={isPosting}
        />

        <button
          type="button"
          onClick={handlePostAnnouncement}
          disabled={isPosting}
        >
          {isPosting
            ? 'Posting...'
            : 'Post Announcement'}
        </button>
      </div>

      <div className="recent-section">
        <h2>Posted Announcements</h2>

        {announcements.length === 0 ? (
          <p>No announcements posted yet.</p>
        ) : (
          announcements.map((announcement) => (
            <div
              className="notification-card"
              key={announcement.id}
            >
              <strong>
                {announcement.title}
              </strong>

              <p>{announcement.message}</p>

              <small>
                {new Date(
                  announcement.created_at
                ).toLocaleString()}
              </small>
            </div>
          ))
        )}
      </div>

      <button
        type="button"
        className="back-button"
        onClick={onBack}
      >
        ← Back to Dashboard
      </button>
    </>
  )
}

export default AdminAnnouncements