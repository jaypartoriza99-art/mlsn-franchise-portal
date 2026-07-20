import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import AdminTicketDetails from './AdminTicketDetails'
import UserManagement from './UserManagement'
import AdminAnnouncements from './AdminAnnouncements'
import InquiryManagement from './InquiryManagement'

function AdminDashboard({ onLogout }) {
  const [tickets, setTickets] = useState([])
  const [selectedTicket, setSelectedTicket] =
    useState(null)

  const [
    showUserManagement,
    setShowUserManagement,
  ] = useState(false)

  const [
    showAnnouncementManagement,
    setShowAnnouncementManagement,
  ] = useState(false)

  const [
    showInquiryManagement,
    setShowInquiryManagement,
  ] = useState(false)

  const [searchTerm, setSearchTerm] =
    useState('')

  const [statusFilter, setStatusFilter] =
    useState('All')

  const [
    priorityFilter,
    setPriorityFilter,
  ] = useState('All')



  const [dateFilter, setDateFilter] =
  useState('')

  const [
    showMyTickets,
    setShowMyTickets,
  ] = useState(false)

  const [notifications, setNotifications] =
    useState([])

  const [
    unreadNotifications,
    setUnreadNotifications,
  ] = useState(0)

  const [
    showNotifications,
    setShowNotifications,
  ] = useState(false)

  const [
    currentUserId,
    setCurrentUserId,
  ] = useState(null)

  const [
    currentUserRole,
    setCurrentUserRole,
  ] = useState('')

  const [errorMessage, setErrorMessage] =
    useState('')

  useEffect(() => {
    let ticketsChannel
    let notificationsChannel
    let isCancelled = false

    const channelInstanceId =
      typeof crypto !== 'undefined' &&
      crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`

    async function initializeDashboard() {
      const {
        data: userData,
        error: userError,
      } = await supabase.auth.getUser()

      const user = userData?.user

      if (userError || !user) {
        console.error(
          'Unable to load CS user:',
          userError
        )

        setErrorMessage(
          'Unable to load your account.'
        )

        return
      }

      setCurrentUserId(user.id)

      const {
        data: profileData,
        error: profileError,
      } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error(
          'Unable to load current user role:',
          profileError
        )

        setErrorMessage(
          'Unable to determine your account permissions.'
        )
      } else {
        setCurrentUserRole(
          profileData?.role || ''
        )
      }

      await fetchAllTickets()
      await fetchNotifications(user.id)

      if (isCancelled) {
        return
      }

      ticketsChannel = supabase
        .channel(
          `admin-dashboard-tickets-${user.id}-${channelInstanceId}`
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'tickets',
          },
          () => {
            fetchAllTickets()
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'tickets',
          },
          () => {
            fetchAllTickets()
          }
        )
        .subscribe((status, error) => {
          console.log(
            'Admin tickets realtime status:',
            status
          )

          if (error) {
            console.error(
              'Admin tickets realtime error:',
              error
            )
          }
        })

      notificationsChannel = supabase
        .channel(
          `admin-notifications-${user.id}-${channelInstanceId}`
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
            'Admin notifications realtime status:',
            status
          )

          if (error) {
            console.error(
              'Admin notifications realtime error:',
              error
            )
          }
        })
    }

    initializeDashboard()

    return () => {
      isCancelled = true

      if (ticketsChannel) {
        supabase.removeChannel(
          ticketsChannel
        )
      }

      if (notificationsChannel) {
        supabase.removeChannel(
          notificationsChannel
        )
      }
    }
  }, [])

  async function addAssignedAgentNames(
    ticketData
  ) {
    const assignedIds = [
      ...new Set(
        ticketData
          .map(
            (ticket) =>
              ticket.assigned_to
          )
          .filter(Boolean)
      ),
    ]

    if (assignedIds.length === 0) {
      return ticketData.map(
        (ticket) => ({
          ...ticket,
          assigned_agent_name:
            'Unassigned',
        })
      )
    }

    const {
      data: profiles,
      error: profilesError,
    } = await supabase
      .from('profiles')
      .select(
        'id, full_name, email'
      )
      .in('id', assignedIds)

    if (profilesError) {
      console.error(
        'Error loading assigned agent profiles:',
        profilesError
      )

      return ticketData.map(
        (ticket) => ({
          ...ticket,
          assigned_agent_name:
            ticket.assigned_to
              ? 'Assigned'
              : 'Unassigned',
        })
      )
    }

    const profileMap = {}

    ;(profiles || []).forEach(
      (profile) => {
        profileMap[profile.id] =
          profile.full_name ||
          profile.email ||
          'Customer Service'
      }
    )

    return ticketData.map(
      (ticket) => ({
        ...ticket,
        assigned_agent_name:
          ticket.assigned_to
            ? profileMap[
                ticket.assigned_to
              ] || 'Assigned'
            : 'Unassigned',
      })
    )
  }

  async function fetchAllTickets() {
    const { data, error } =
      await supabase
        .from('tickets')
        .select('*')
        .order('created_at', {
          ascending: false,
        })

    if (error) {
      console.error(
        'Error loading admin tickets:',
        error
      )

      setErrorMessage(error.message)
      return
    }

    const ticketsWithAgents =
      await addAssignedAgentNames(
        data || []
      )

    setTickets(ticketsWithAgents)
  }

  async function fetchNotifications(
    userId
  ) {
    const { data, error } =
      await supabase
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

      setErrorMessage(error.message)
      return
    }

    const notificationData =
      data || []

    setNotifications(notificationData)

    const unreadCount =
      notificationData.filter(
        (notification) =>
          !notification.is_read
      ).length

    setUnreadNotifications(
      unreadCount
    )
  }

  async function handleOpenNotifications() {
    const willOpen =
      !showNotifications

    setShowNotifications(willOpen)

    if (
      !willOpen ||
      unreadNotifications === 0
    ) {
      return
    }

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
        'Error marking admin notifications as read:',
        error
      )

      setErrorMessage(error.message)
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

  async function handleNotificationClick(
    notification
  ) {
    setErrorMessage('')

    if (!notification.ticket_id) {
      setErrorMessage(
        'This notification is not connected to a ticket.'
      )

      return
    }

    const ticketFromState =
      tickets.find(
        (ticket) =>
          ticket.id ===
          notification.ticket_id
      )

    if (ticketFromState) {
      setSelectedTicket(
        ticketFromState
      )

      setShowNotifications(false)
      return
    }

    const { data, error } =
      await supabase
        .from('tickets')
        .select('*')
        .eq(
          'id',
          notification.ticket_id
        )
        .single()

    if (error) {
      console.error(
        'Error opening notification ticket:',
        error
      )

      setErrorMessage(
        'The ticket connected to this notification could not be opened.'
      )

      return
    }

    const enrichedTickets =
      await addAssignedAgentNames([
        data,
      ])

    setSelectedTicket(
      enrichedTickets[0]
    )

    setShowNotifications(false)
  }

  function getPriorityClass(
    priority
  ) {
    switch (priority) {
      case 'Urgent':
        return 'priority-badge priority-urgent'

      case 'High':
        return 'priority-badge priority-high'

      case 'Medium':
        return 'priority-badge priority-medium'

      case 'Low':
        return 'priority-badge priority-low'

      default:
        return 'priority-badge'
    }
  }

  if (showUserManagement) {
    return (
      <UserManagement
        currentUserRole={
          currentUserRole
        }
        onBack={() => {
          setShowUserManagement(
            false
          )
        }}
      />
    )
  }

  if (showAnnouncementManagement) {
    return (
      <AdminAnnouncements
        onBack={() => {
          setShowAnnouncementManagement(
            false
          )
        }}
      />
    )
  }

  if (showInquiryManagement) {
    return (
      <InquiryManagement
        onBack={() => {
          setShowInquiryManagement(
            false
          )
        }}
      />
    )
  }

  if (selectedTicket) {
    return (
      <AdminTicketDetails
        selectedTicket={
          selectedTicket
        }
        onBack={() => {
          setSelectedTicket(null)

          fetchAllTickets()

          if (currentUserId) {
            fetchNotifications(
              currentUserId
            )
          }
        }}
      />
    )
  }

  const filteredTickets =
    tickets.filter((ticket) => {
      const search = searchTerm
        .trim()
        .toLowerCase()

      const submittedDate =
        ticket.created_at
          ? new Date(
              ticket.created_at
            )
          : null

      const validSubmittedDate =
        submittedDate &&
        !Number.isNaN(
          submittedDate.getTime()
        )

      const ticketDate =
        validSubmittedDate
          ? submittedDate.toLocaleDateString()
          : ''

      const ticketMonth =
        validSubmittedDate
          ? submittedDate.toLocaleString(
              'default',
              {
                month: 'long',
              }
            )
          : ''

      const ticketMonthYear =
        validSubmittedDate
          ? submittedDate.toLocaleString(
              'default',
              {
                month: 'long',
                year: 'numeric',
              }
            )
          : ''

      const ticketYear =
        validSubmittedDate
          ? submittedDate
              .getFullYear()
              .toString()
          : ''

      const matchesSearch =
        !search ||
        ticket.ticket_number
          ?.toLowerCase()
          .includes(search) ||
        ticket.franchisee_name
          ?.toLowerCase()
          .includes(search) ||
        ticket.subject
          ?.toLowerCase()
          .includes(search) ||
        ticket.location
          ?.toLowerCase()
          .includes(search) ||
        ticket.category
          ?.toLowerCase()
          .includes(search) ||
        ticket.status
          ?.toLowerCase()
          .includes(search) ||
        ticket.assigned_agent_name
          ?.toLowerCase()
          .includes(search) ||
        ticketDate
          .toLowerCase()
          .includes(search) ||
        ticketMonth
          .toLowerCase()
          .includes(search) ||
        ticketMonthYear
          .toLowerCase()
          .includes(search) ||
        ticketYear.includes(search)

      const matchesStatus =
  statusFilter === 'All' ||
  ticket.status === statusFilter

const matchesPriority =
  priorityFilter === 'All' ||
  ticket.priority ===
    priorityFilter

const matchesDate =
  !dateFilter ||
  (
    ticket.created_at &&
    new Date(ticket.created_at)
      .toISOString()
      .split('T')[0] ===
      dateFilter
  )

const matchesAssignment =
  !showMyTickets ||
  ticket.assigned_to ===
    currentUserId

return (
  matchesSearch &&
  matchesStatus &&
  matchesPriority &&
  matchesDate &&
  matchesAssignment
)
})

  const submittedCount =
    tickets.filter(
      (ticket) =>
        ticket.status === 'Submitted'
    ).length

  const inProgressCount =
    tickets.filter(
      (ticket) =>
        ticket.status ===
        'In Progress'
    ).length

  const waitingCount =
    tickets.filter(
      (ticket) =>
        ticket.status ===
        'Waiting for Franchisee'
    ).length

  const resolvedCount =
    tickets.filter(
      (ticket) =>
        ticket.status ===
          'Resolved' ||
        ticket.status === 'Closed'
    ).length

  const urgentCount =
    tickets.filter(
      (ticket) =>
        ticket.priority ===
          'Urgent' &&
        ticket.status !==
          'Resolved' &&
        ticket.status !== 'Closed'
    ).length

  const myTicketsCount =
    tickets.filter(
      (ticket) =>
        ticket.assigned_to ===
        currentUserId
    ).length

  const canManageUsers =
    currentUserRole === 'admin' ||
    currentUserRole ===
      'supervisor' ||
    currentUserRole ===
      'customer_service'

  const canManageAnnouncements =
    currentUserRole === 'admin' ||
    currentUserRole ===
      'supervisor' ||
    currentUserRole ===
      'customer_service'

  return (
    <>
      <div className="page-header">
        <h1>
          Customer Service Dashboard
        </h1>

        <p>
          Manage and respond to
          franchisee concerns.
        </p>
      </div>

      {errorMessage && (
        <div className="error-message">
          {errorMessage}
        </div>
      )}

      <div className="admin-dashboard-actions">
        <div className="admin-action-group">
          <button
            type="button"
            className="notification-button"
            onClick={
              handleOpenNotifications
            }
          >
            🔔 Notifications

            {unreadNotifications >
              0 && (
              <span className="notification-count">
                {
                  unreadNotifications
                }
              </span>
            )}
          </button>

          {canManageUsers && (
            <button
              type="button"
              className="user-management-button"
              onClick={() => {
                setShowNotifications(
                  false
                )

                setShowUserManagement(
                  true
                )
              }}
            >
              👥 User Management
            </button>
          )}

          {canManageAnnouncements && (
            <button
              type="button"
              className="user-management-button"
              onClick={() => {
                setShowNotifications(
                  false
                )

                setShowAnnouncementManagement(
                  true
                )
              }}
            >
              📢 Announcements
            </button>
          )}

          {canManageAnnouncements && (
            <button
              type="button"
              className="user-management-button"
              onClick={() => {
                setShowNotifications(
                  false
                )

                setShowInquiryManagement(
                  true
                )
              }}
            >
              📋 Franchise Inquiries
            </button>
          )}
        </div>

        <button
          type="button"
          className="back-button"
          onClick={onLogout}
        >
          Logout
        </button>
      </div>

      {showNotifications && (
        <div className="admin-notifications-panel">
          <div className="notification-panel-header">
            <h2>Notifications</h2>

            <button
              type="button"
              onClick={() => {
                setShowNotifications(
                  false
                )
              }}
            >
              Close
            </button>
          </div>

          {notifications.length ===
          0 ? (
            <p>
              No notifications yet.
            </p>
          ) : (
            notifications.map(
              (notification) => (
                <div
                  className={`notification-card ${
                    notification.is_read
                      ? ''
                      : 'notification-unread'
                  }`}
                  key={
                    notification.id
                  }
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    handleNotificationClick(
                      notification
                    )
                  }}
                  onKeyDown={(
                    event
                  ) => {
                    if (
                      event.key ===
                        'Enter' ||
                      event.key === ' '
                    ) {
                      handleNotificationClick(
                        notification
                      )
                    }
                  }}
                  style={{
                    cursor:
                      'pointer',
                  }}
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
      )}

      <div className="stats modern-stats">
        <div className="stat-card modern-card">
          <span className="stat-icon">
            🟡
          </span>

          <h3>Submitted</h3>
          <p>{submittedCount}</p>
        </div>

        <div className="stat-card modern-card">
          <span className="stat-icon">
            🔵
          </span>

          <h3>In Progress</h3>
          <p>{inProgressCount}</p>
        </div>

        <div className="stat-card modern-card">
          <span className="stat-icon">
            🟣
          </span>

          <h3>Waiting</h3>
          <p>{waitingCount}</p>
        </div>

        <div className="stat-card modern-card">
          <span className="stat-icon">
            🟢
          </span>

          <h3>Resolved</h3>
          <p>{resolvedCount}</p>
        </div>

        <div className="stat-card modern-card">
          <span className="stat-icon">
            🚨
          </span>

          <h3>Urgent Open</h3>
          <p>{urgentCount}</p>
        </div>

        <div className="stat-card modern-card">
          <span className="stat-icon">
            👤
          </span>

          <h3>Assigned to Me</h3>
          <p>{myTicketsCount}</p>
        </div>
      </div>

      <div className="my-tickets-toggle">
        <button
          type="button"
          className={
            showMyTickets
              ? 'active'
              : ''
          }
          onClick={() => {
            setShowMyTickets(
              (currentValue) =>
                !currentValue
            )
          }}
        >
          {showMyTickets
            ? 'Show All Tickets'
            : `Show My Tickets (${myTicketsCount})`}
        </button>

        {showMyTickets && (
          <span>
            Showing only tickets
            assigned to your account.
          </span>
        )}
      </div>

      <div className="filter-section">
        <input
          type="text"
          placeholder="Search by franchisee, ticket no., location, concern, representative, month or year..."
          value={searchTerm}
          onChange={(event) => {
            setSearchTerm(
              event.target.value
            )
          }}
        />

        <select
          value={statusFilter}
          onChange={(event) => {
            setStatusFilter(
              event.target.value
            )
          }}
        >
          <option value="All">
            All TicketStatus
          </option>

          <option value="Submitted">
            Submitted
          </option>

          <option value="In Progress">
            In Progress
          </option>

          <option value="Waiting for Franchisee">
            Waiting for Franchisee
          </option>

          <option value="Resolved">
            Resolved
          </option>

          <option value="Closed">
            Closed
          </option>
        </select>

        <select
          value={priorityFilter}
          onChange={(event) => {
            setPriorityFilter(
              event.target.value
            )
          }}
        >
          <option value="All">
            All Priorities
          </option>

          <option value="Low">
            Low
          </option>

          <option value="Medium">
            Medium
          </option>

          <option value="High">
            High
          </option>

          <option value="Urgent">
            Urgent
          </option>
        </select>

        

        <input
  type="date"
  value={dateFilter}
  onChange={(event) => {
    setDateFilter(
      event.target.value
    )
  }}
/>
      </div>

      <div className="recent-section">
        <h2>
          {showMyTickets
            ? 'My Assigned Tickets'
            : 'All Franchisee Tickets'}
        </h2>

        <table>
          <thead>
            <tr>
              <th>Ticket No.</th>
              <th>Franchisee</th>
              <th>Location</th>
              <th>Concern</th>
              <th>Date Submitted</th>
              <th>Priority</th>
              <th>Assigned To</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {filteredTickets.length ===
            0 ? (
              <tr>
                <td colSpan="8">
                  {showMyTickets
                    ? 'No tickets are currently assigned to you.'
                    : 'No matching tickets found.'}
                </td>
              </tr>
            ) : (
              filteredTickets.map(
                (ticket) => (
                  <tr
                    key={ticket.id}
                    onClick={() => {
                      setSelectedTicket(
                        ticket
                      )
                    }}
                    style={{
                      cursor:
                        'pointer',
                    }}
                  >
                    <td>
                      {
                        ticket.ticket_number
                      }
                    </td>

                    <td>
                      {ticket.franchisee_name ||
                        'N/A'}
                    </td>

                    <td>
                      {ticket.location ||
                        'N/A'}
                    </td>

                    <td>
                      {ticket.subject}
                    </td>

                    <td>
                      {ticket.created_at
                        ? new Date(
                            ticket.created_at
                          ).toLocaleDateString()
                        : 'N/A'}
                    </td>

                    <td>
                      <span
                        className={getPriorityClass(
                          ticket.priority
                        )}
                      >
                        {
                          ticket.priority
                        }
                      </span>
                    </td>

                    <td>
                      {ticket.assigned_agent_name ||
                        'Unassigned'}
                    </td>

                    <td>
                      {ticket.status}
                    </td>
                  </tr>
                )
              )
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}

export default AdminDashboard