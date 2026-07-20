import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

function Announcements() {
  const [announcements, setAnnouncements] = useState([])
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let channel
    let isCancelled = false

    const channelInstanceId =
      typeof crypto !== 'undefined' &&
      crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`

    async function initializeAnnouncements() {
      await fetchAnnouncements()

      if (isCancelled) {
        return
      }

      channel = supabase
        .channel(
          `franchisee-announcements-${channelInstanceId}`
        )
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
            'Franchisee announcements realtime status:',
            status
          )

          if (error) {
            console.error(
              'Franchisee announcements realtime error:',
              error
            )
          }
        })
    }

    initializeAnnouncements()

    return () => {
      isCancelled = true

      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [])

  async function fetchAnnouncements() {
    setErrorMessage('')
    setIsLoading(true)

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
      setIsLoading(false)
      return
    }

    setAnnouncements(data || [])
    setIsLoading(false)
  }

  return (
    <>
      <div className="page-header">
        <h1>Announcements</h1>

        <p>
          View company updates, advisories, and
          important memos.
        </p>
      </div>

      {errorMessage && (
        <div className="error-message">
          {errorMessage}
        </div>
      )}

      <div className="announcement-list">
        {isLoading ? (
          <p>Loading announcements...</p>
        ) : announcements.length === 0 ? (
          <div className="announcement-card">
            <h3>No announcements yet</h3>

            <p>
              Company updates and advisories will
              appear here once posted.
            </p>
          </div>
        ) : (
          announcements.map((announcement) => (
            <div
              className="announcement-card"
              key={announcement.id}
            >
              <h3>{announcement.title}</h3>

              <p>{announcement.message}</p>

              <small>
                Posted:{' '}
                {new Date(
                  announcement.created_at
                ).toLocaleString()}
              </small>
            </div>
          ))
        )}
      </div>
    </>
  )
}

export default Announcements