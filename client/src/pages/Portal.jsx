import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Sidebar from '../components/layout/Sidebar'
import Dashboard from './Dashboard'
import SubmitConcern from './SubmitConcern'
import MyTickets from './MyTickets'
import Announcements from './Announcements'
import TicketDetails from './TicketDetails'
import Profile from './Profile'

function Portal({ onLogout }) {
  const [activePage, setActivePage] =
    useState('dashboard')

  const [
    unreadAnnouncements,
    setUnreadAnnouncements,
  ] = useState(0)

  const [
    unreadNotifications,
    setUnreadNotifications,
  ] = useState(0)

  const [notifications, setNotifications] =
    useState([])

  const [selectedTicket, setSelectedTicket] =
    useState(null)

  const [tickets, setTickets] = useState([])

  const [marketingLink, setMarketingLink] =
    useState('')

  const [
    franchisePackage,
    setFranchisePackage,
  ] = useState('')

  const [
    marketingLibraryLoading,
    setMarketingLibraryLoading,
  ] = useState(true)

  useEffect(() => {
    fetchTickets()
    fetchMarketingLibrary()
  }, [])

  useEffect(() => {
    if (
      activePage === 'dashboard' ||
      activePage === 'tickets'
    ) {
      fetchTickets()
    }

    if (activePage === 'marketing') {
      fetchMarketingLibrary()
    }
  }, [activePage])

  useEffect(() => {
    let notificationChannel
    let announcementChannel
    let isCancelled = false

    const channelInstanceId =
      typeof crypto !== 'undefined' &&
      crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`

    async function setupRealtime() {
      const {
        data: userData,
        error: userError,
      } = await supabase.auth.getUser()

      const user = userData?.user

      if (userError || !user) {
        console.error(
          'Unable to load portal user:',
          userError
        )
        return
      }

      await fetchNotifications(user.id)
      await fetchUnreadAnnouncements(user.id)

      if (isCancelled) {
        return
      }

      notificationChannel = supabase
        .channel(
          `notifications-${user.id}-${channelInstanceId}`
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const newNotification =
              payload.new

            setNotifications(
              (currentNotifications) => [
                newNotification,
                ...currentNotifications,
              ]
            )

            if (!newNotification.is_read) {
              setUnreadNotifications(
                (currentCount) =>
                  currentCount + 1
              )
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            setNotifications(
              (currentNotifications) =>
                currentNotifications.map(
                  (notification) =>
                    notification.id ===
                    payload.new.id
                      ? payload.new
                      : notification
                )
            )
          }
        )
        .subscribe((status, error) => {
          console.log(
            'Notifications realtime status:',
            status
          )

          if (error) {
            console.error(
              'Notifications realtime error:',
              error
            )
          }
        })

      announcementChannel = supabase
        .channel(
          `portal-announcements-${user.id}-${channelInstanceId}`
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'announcements',
          },
          () => {
            setUnreadAnnouncements(
              (currentCount) =>
                currentCount + 1
            )
          }
        )
        .subscribe((status, error) => {
          console.log(
            'Portal announcements realtime status:',
            status
          )

          if (error) {
            console.error(
              'Portal announcements realtime error:',
              error
            )
          }
        })
    }

    setupRealtime()

    return () => {
      isCancelled = true

      if (notificationChannel) {
        supabase.removeChannel(
          notificationChannel
        )
      }

      if (announcementChannel) {
        supabase.removeChannel(
          announcementChannel
        )
      }
    }
  }, [])

  useEffect(() => {
    if (activePage === 'announcements') {
      markAnnouncementsAsRead()
    }
  }, [activePage])

  async function fetchTickets() {
    const { data: userData } =
      await supabase.auth.getUser()

    const user = userData?.user

    if (!user) {
      return
    }

    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', {
        ascending: false,
      })

    if (error) {
      console.error(
        'Error loading tickets:',
        error
      )
      return
    }

    const formattedTickets = (data || []).map(
      (ticket) => ({
        id: ticket.id,
        ticketNo: ticket.ticket_number,
        concern: ticket.subject,
        department: ticket.category,
        priority: ticket.priority,
        description: ticket.description,
        status: ticket.status,
      })
    )

    setTickets(formattedTickets)
  }

  async function fetchMarketingLibrary() {
    setMarketingLibraryLoading(true)

    const {
      data: userData,
      error: userError,
    } = await supabase.auth.getUser()

    const user = userData?.user

    if (userError || !user) {
      console.error(
        'Unable to load marketing library user:',
        userError
      )

      setMarketingLink('')
      setFranchisePackage('')
      setMarketingLibraryLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('profiles')
      .select(`
        franchise_package,
        marketing_drive_link
      `)
      .eq('id', user.id)
      .single()

    if (error) {
      console.error(
        'Error loading marketing library:',
        error
      )

      setMarketingLink('')
      setFranchisePackage('')
      setMarketingLibraryLoading(false)
      return
    }

    setFranchisePackage(
      data?.franchise_package || ''
    )

    setMarketingLink(
      data?.marketing_drive_link || ''
    )

    setMarketingLibraryLoading(false)
  }

  async function fetchNotifications(userId) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', {
        ascending: false,
      })

    if (error) {
      console.error(
        'Error loading notifications:',
        error
      )
      return
    }

    const notificationData = data || []

    setNotifications(notificationData)

    const unreadCount =
      notificationData.filter(
        (notification) =>
          !notification.is_read
      ).length

    setUnreadNotifications(unreadCount)
  }

  async function fetchUnreadAnnouncements(
    userId
  ) {
    const storageKey =
      `announcements-last-seen-${userId}`

    const lastSeen =
      localStorage.getItem(storageKey)

    let query = supabase
      .from('announcements')
      .select('id', {
        count: 'exact',
        head: true,
      })

    if (lastSeen) {
      query = query.gt(
        'created_at',
        lastSeen
      )
    }

    const { count, error } = await query

    if (error) {
      console.error(
        'Error loading unread announcements:',
        error
      )
      return
    }

    setUnreadAnnouncements(count || 0)
  }

  async function markAnnouncementsAsRead() {
    const {
      data: userData,
      error: userError,
    } = await supabase.auth.getUser()

    const user = userData?.user

    if (userError || !user) {
      return
    }

    const storageKey =
      `announcements-last-seen-${user.id}`

    localStorage.setItem(
      storageKey,
      new Date().toISOString()
    )

    setUnreadAnnouncements(0)
  }

  async function handleOpenNotifications() {
    setActivePage('notifications')

    const unreadIds = notifications
      .filter(
        (notification) =>
          !notification.is_read
      )
      .map(
        (notification) =>
          notification.id
      )

    if (unreadIds.length === 0) {
      setUnreadNotifications(0)
      return
    }

    const { error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
      })
      .in('id', unreadIds)

    if (error) {
      console.error(
        'Error marking notifications as read:',
        error
      )
      return
    }

    setNotifications(
      (currentNotifications) =>
        currentNotifications.map(
          (notification) => ({
            ...notification,
            is_read: true,
          })
        )
    )

    setUnreadNotifications(0)
  }

  return (
    <div className="portal-layout">
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        onLogout={onLogout}
        unreadAnnouncements={
          unreadAnnouncements
        }
        setUnreadAnnouncements={
          setUnreadAnnouncements
        }
        unreadNotifications={
          unreadNotifications
        }
        onOpenNotifications={
          handleOpenNotifications
        }
      />

      <main className="main-content">
        {activePage === 'dashboard' && (
          <Dashboard tickets={tickets} />
        )}

        {activePage === 'submit' && (
          <SubmitConcern
            tickets={tickets}
            setTickets={setTickets}
          />
        )}

        {activePage === 'tickets' && (
          <MyTickets
            tickets={tickets}
            setTickets={setTickets}
            setSelectedTicket={
              setSelectedTicket
            }
            setActivePage={setActivePage}
          />
        )}

        {activePage ===
          'ticketDetails' && (
          <TicketDetails
            selectedTicket={selectedTicket}
            onBack={() => {
              setSelectedTicket(null)
              setActivePage('tickets')
            }}
          />
        )}

        {activePage ===
          'notifications' && (
          <>
            <div className="page-header">
              <h1>Notifications</h1>

              <p>
                View your latest ticket
                updates and replies.
              </p>
            </div>

            <div className="recent-section">
              {notifications.length === 0 ? (
                <p>No notifications yet.</p>
              ) : (
                notifications.map(
                  (notification) => (
                    <div
                      className="notification-card"
                      key={
                        notification.id
                      }
                    >
                      <strong>
                        {
                          notification.title
                        }
                      </strong>

                      <p>
                        {
                          notification.message
                        }
                      </p>

                      <small>
                        {new Date(
                          notification.created_at
                        ).toLocaleString()}
                      </small>
                    </div>
                  )
                )
              )}
            </div>
          </>
        )}

        {activePage ===
          'announcements' && (
          <Announcements />
        )}

        {activePage === 'marketing' && (
          <>
            <div className="page-header">
              <h1>Marketing Library</h1>

              <p>
                Access approved marketing
                materials, posters, videos,
                logos, and menus.
              </p>
            </div>

            <div className="announcement-list">
              <div className="announcement-card">
                {marketingLibraryLoading ? (
                  <>
                    <h3>
                      Loading Marketing Library
                    </h3>

                    <p>
                      Please wait while your
                      assigned materials are
                      being loaded.
                    </p>
                  </>
                ) : (
                  <>
                    <h3>
                      📁{' '}
                      {franchisePackage ||
                        'Marketing Materials'}
                    </h3>

                    <p>
                      Access the approved
                      marketing materials for
                      your franchise package.
                    </p>

                    {marketingLink ? (
                      <a
                        href={marketingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="marketing-drive-button"
                      >
                        📁 Open Google Drive
                      </a>
                    ) : (
                      <div className="error-message">
                        No marketing library has
                        been assigned to your
                        account yet. Please
                        contact Customer Service.
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </>
        )}

        {activePage === 'profile' && (
  <Profile />
)}
      </main>
    </div>
  )
}

export default Portal