import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import AdminTicketDetails from './AdminTicketDetails'
import UserManagement from './UserManagement'
import AdminAnnouncements from './AdminAnnouncements'
import InquiryManagement from './InquiryManagement'
import SupervisorSurveyDashboard
  from './SupervisorSurveyDashboard'
import ExecutiveReports from './ExecutiveReports'
import DashboardHero from '../components/dashboard/DashboardHero'
import ExecutiveKpiGrid from '../components/dashboard/ExecutiveKpiGrid'
import DashboardFocusActions from '../components/dashboard/DashboardFocusActions'
import AdminDashboardToolbar from '../components/dashboard/AdminDashboardToolbar'
import TicketStatusCards from '../components/dashboard/TicketStatusCards'
import ExecutiveAnalyticsSection from '../components/dashboard/ExecutiveAnalyticsSection'
import ExecutiveOperationsSection from '../components/dashboard/ExecutiveOperationsSection'
import {
  buildTicketAnalytics,
  fetchDashboardAnalytics,
} from '../services/dashboard/DashboardAnalytics'

const SLA_HOURS = {
  Urgent: 4,
  High: 24,
  Medium: 48,
  Low: 72,
}

function formatDuration(milliseconds) {
  const totalMinutes = Math.max(
    0,
    Math.floor(
      Math.abs(milliseconds) / 60000
    )
  )

  const days = Math.floor(
    totalMinutes / 1440
  )
  const hours = Math.floor(
    (totalMinutes % 1440) / 60
  )
  const minutes =
    totalMinutes % 60

  const parts = []

  if (days > 0) {
    parts.push(`${days}d`)
  }

  if (hours > 0) {
    parts.push(`${hours}h`)
  }

  if (
    minutes > 0 ||
    parts.length === 0
  ) {
    parts.push(`${minutes}m`)
  }

  return parts.join(' ')
}

function getSlaDisplay(ticket, now) {
  if (
    !ticket.priority_locked ||
    !ticket.sla_due_at
  ) {
    return {
      label: 'SLA not started',
      className: 'sla-badge sla-pending',
    }
  }

  if (
    ticket.status === 'Resolved' ||
    ticket.status === 'Closed'
  ) {
    return {
      label: 'SLA completed',
      className: 'sla-badge sla-completed',
    }
  }

  const dueAt = new Date(
    ticket.sla_due_at
  )
  const difference =
    dueAt.getTime() -
    now.getTime()

  if (difference >= 0) {
    return {
      label:
        `⏰ Due in: ` +
        formatDuration(difference),
      className: 'sla-badge sla-active',
    }
  }

  return {
    label:
      `⚠ Overdue by: ` +
      formatDuration(difference),
    className: 'sla-badge sla-overdue',
  }
}

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

  const [
    showSurveyDashboard,
    setShowSurveyDashboard,
  ] = useState(false)

  const [
    showExecutiveReports,
    setShowExecutiveReports,
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

  const [slaFilter, setSlaFilter] =
    useState('All')

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

  const [currentTime, setCurrentTime] =
    useState(new Date())

  const [currentUserName, setCurrentUserName] =
    useState('')

  const [dashboardMetrics, setDashboardMetrics] =
    useState({
      franchisees: 0,
      concepts: 0,
      packageTypes: 0,
      newFranchiseesThisMonth: 0,
      packageDistribution: [],
      conceptDistribution: [],
      regionDistribution: [],
      monthlyGrowth: [],
      recentFranchisees: [],
    })

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
        .select('role, full_name, email')
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

        setCurrentUserName(
          profileData?.full_name ||
            profileData?.email?.split('@')[0] ||
            'Team Member'
        )
      }

      await fetchAllTickets()
      await fetchNotifications(user.id)
      await loadDashboardAnalytics()

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

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)

    return () => {
      clearInterval(timer)
    }
  }, [])

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

  async function loadDashboardAnalytics() {
    try {
      const analytics =
        await fetchDashboardAnalytics()

      setDashboardMetrics(analytics)
    } catch (error) {
      console.error(
        'Unable to load dashboard analytics:',
        error
      )

      setErrorMessage(
        'Some dashboard analytics could not be loaded.'
      )
    }
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


  async function handlePriorityChange(
    ticketId,
    newPriority
  ) {
    setErrorMessage('')

    const selectedTicket =
      tickets.find(
        (ticket) =>
          ticket.id === ticketId
      )

    const normalizedRole =
      currentUserRole
        ?.trim()
        .toLowerCase()

    if (
      normalizedRole !==
        'customer_service' ||
      selectedTicket?.assigned_to !==
        currentUserId
    ) {
      setErrorMessage(
        'Only the assigned Customer Service representative can set this ticket priority.'
      )
      return
    }

    if (
      selectedTicket
        ?.priority_locked === true
    ) {
      setErrorMessage(
        'This ticket priority has already been set and locked.'
      )
      return
    }

    const nowDate = new Date()
    const now = nowDate.toISOString()
    const slaHours =
      SLA_HOURS[newPriority] || 72
    const slaDueAt = new Date(
      nowDate.getTime() +
        slaHours * 60 * 60 * 1000
    ).toISOString()

    const {
      data,
      error,
    } = await supabase
      .from('tickets')
      .update({
        priority: newPriority,
        priority_locked: true,
        priority_set_by:
          currentUserId,
        priority_set_at: now,
        sla_due_at: slaDueAt,
        status: 'In Progress',
        updated_at: now,
      })
      .eq('id', ticketId)
      .eq(
        'assigned_to',
        currentUserId
      )
      .eq(
        'priority_locked',
        false
      )
      .select(
        'id, priority, priority_locked, priority_set_by, priority_set_at, sla_due_at, status, updated_at, user_id, ticket_number'
      )
      .maybeSingle()

    if (error) {
      console.error(
        'Error updating ticket priority:',
        error
      )

      setErrorMessage(
        'Unable to set the ticket priority.'
      )
      return
    }

    if (!data) {
      setErrorMessage(
        'The priority could not be changed. The ticket may be unassigned, assigned to another representative, or already locked.'
      )

      await fetchAllTickets()
      return
    }

    setTickets((currentTickets) =>
      currentTickets.map((ticket) =>
        ticket.id === ticketId
          ? {
              ...ticket,
              priority:
                data.priority,
              priority_locked:
                data.priority_locked,
              priority_set_by:
                data.priority_set_by,
              priority_set_at:
                data.priority_set_at,
              sla_due_at:
                data.sla_due_at,
              status:
                data.status,
              updated_at:
                data.updated_at,
            }
          : ticket
      )
    )

    if (data.user_id) {
      const {
        error: notificationError,
      } = await supabase
        .from('notifications')
        .insert([
          {
            user_id: data.user_id,
            ticket_id: ticketId,
            title:
              'Ticket Is Now Being Handled',
            message:
              `Your ticket ${data.ticket_number} ` +
              `has been assigned a ${newPriority} priority and is now In Progress.`,
            notification_type:
              'priority_set',
            is_read: false,
          },
        ])

      if (notificationError) {
        console.error(
          'Error creating priority notification:',
          notificationError
        )
      }
    }
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

  if (showSurveyDashboard) {
  return (
    <>
      <button
        className="back-button"
        onClick={() =>
          setShowSurveyDashboard(
            false
          )
        }
        style={{
          marginBottom: '20px',
        }}
      >
        ← Back
      </button>

      <SupervisorSurveyDashboard />
    </>
  )
}

  if (showExecutiveReports) {
    return (
      <ExecutiveReports
        tickets={tickets}
        dashboardMetrics={dashboardMetrics}
        onBack={() => setShowExecutiveReports(false)}
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

  function isOpenTicket(ticket) {
    return (
      ticket.status !== 'Resolved' &&
      ticket.status !== 'Closed'
    )
  }

  function isOverdueTicket(ticket) {
    if (
      !isOpenTicket(ticket) ||
      !ticket.priority_locked ||
      !ticket.sla_due_at
    ) {
      return false
    }

    const dueAt = new Date(
      ticket.sla_due_at
    )

    return (
      !Number.isNaN(dueAt.getTime()) &&
      dueAt.getTime() <
        currentTime.getTime()
    )
  }

  function isNearSlaTicket(ticket) {
    if (
      !isOpenTicket(ticket) ||
      !ticket.priority_locked ||
      !ticket.sla_due_at ||
      isOverdueTicket(ticket)
    ) {
      return false
    }

    const dueAt = new Date(
      ticket.sla_due_at
    )

    if (Number.isNaN(dueAt.getTime())) {
      return false
    }

    const remainingMilliseconds =
      dueAt.getTime() -
      currentTime.getTime()

    const totalSlaHours =
      SLA_HOURS[ticket.priority] || 72

    const nearSlaThreshold =
      totalSlaHours *
      0.25 *
      60 *
      60 *
      1000

    return (
      remainingMilliseconds > 0 &&
      remainingMilliseconds <=
        nearSlaThreshold
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

const matchesSla =
  slaFilter === 'All' ||
  (
    slaFilter === 'Near SLA' &&
    isNearSlaTicket(ticket)
  ) ||
  (
    slaFilter === 'Overdue' &&
    isOverdueTicket(ticket)
  )

return (
  matchesSearch &&
  matchesStatus &&
  matchesPriority &&
  matchesDate &&
  matchesAssignment &&
  matchesSla
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

  const nearSlaCount =
    tickets.filter(
      isNearSlaTicket
    ).length

  const overdueCount =
    tickets.filter(
      isOverdueTicket
    ).length

  const myTicketsCount =
    tickets.filter(
      (ticket) =>
        ticket.assigned_to ===
        currentUserId
    ).length

  const canManageUsers =
    currentUserRole === 'supervisor' ||
    currentUserRole === 'customer_service'

  const normalizedUserRole =
    currentUserRole
      ?.trim()
      .toLowerCase()

  const isCustomerService =
    normalizedUserRole ===
    'customer_service'

  const canManageAnnouncements =
    currentUserRole === 'supervisor' ||
    currentUserRole === 'customer_service'

  const openTicketCount = tickets.filter(
    isOpenTicket
  ).length

  const hour = currentTime.getHours()
  const greeting =
    hour < 12
      ? 'Good Morning'
      : hour < 18
        ? 'Good Afternoon'
        : 'Good Evening'

  const dashboardDate =
    currentTime.toLocaleDateString(
      'en-PH',
      {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }
    )

  const ticketAnalytics =
    buildTicketAnalytics(
      tickets,
      currentTime
    )

  return (
    <>
      <DashboardHero
        greeting={greeting}
        currentUserName={currentUserName}
        normalizedUserRole={normalizedUserRole}
        dashboardDate={dashboardDate}
      />

      {errorMessage && (
        <div className="error-message">
          {errorMessage}
        </div>
      )}

      <ExecutiveKpiGrid
        dashboardMetrics={dashboardMetrics}
        openTicketCount={openTicketCount}
        overdueCount={overdueCount}
        nearSlaCount={nearSlaCount}
      />

      {normalizedUserRole === 'supervisor' && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            margin: '14px 0',
          }}
        >
          <button
            type="button"
            onClick={() => {
              setShowNotifications(false)
              setShowExecutiveReports(true)
            }}
            style={{
              border: 'none',
              borderRadius: '12px',
              padding: '12px 18px',
              background:
                'linear-gradient(135deg, #6f35b5, #4d2384)',
              color: '#ffffff',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            📄 Executive Reports
          </button>
        </div>
      )}

      <ExecutiveAnalyticsSection
        ticketStatus={
          ticketAnalytics.statusDistribution
        }
        packageDistribution={
          dashboardMetrics.packageDistribution || []
        }
        monthlyGrowth={
          dashboardMetrics.monthlyGrowth || []
        }
        regionDistribution={
          dashboardMetrics.regionDistribution || []
        }
      />

      <ExecutiveOperationsSection
        tickets={tickets}
        dashboardMetrics={dashboardMetrics}
        ticketAnalytics={ticketAnalytics}
        nearSlaCount={nearSlaCount}
        overdueCount={overdueCount}
      />

      <DashboardFocusActions
        overdueCount={overdueCount}
        nearSlaCount={nearSlaCount}
        submittedCount={submittedCount}
        canManageUsers={canManageUsers}
        canManageAnnouncements={canManageAnnouncements}
        isSupervisor={normalizedUserRole === 'supervisor'}
        onShowOverdue={() => {
          setSlaFilter('Overdue')
          setStatusFilter('All')
          setPriorityFilter('All')
          setShowMyTickets(false)
        }}
        onShowNearSla={() => {
          setSlaFilter('Near SLA')
          setStatusFilter('All')
          setPriorityFilter('All')
          setShowMyTickets(false)
        }}
        onShowSubmitted={() => {
          setStatusFilter('Submitted')
          setPriorityFilter('All')
          setSlaFilter('All')
          setShowMyTickets(false)
        }}
        onOpenUserManagement={() => {
          setShowNotifications(false)
          setShowUserManagement(true)
        }}
        onOpenAnnouncements={() => {
          setShowNotifications(false)
          setShowAnnouncementManagement(true)
        }}
        onOpenInquiries={() => {
          setShowNotifications(false)
          setShowInquiryManagement(true)
        }}
        onOpenSurveyAnalytics={() => {
          setShowNotifications(false)
          setShowSurveyDashboard(true)
        }}
      />

      <AdminDashboardToolbar
        unreadNotifications={unreadNotifications}
        canManageUsers={canManageUsers}
        canManageAnnouncements={canManageAnnouncements}
        isSupervisor={normalizedUserRole === 'supervisor'}
        onOpenNotifications={handleOpenNotifications}
        onOpenUserManagement={() => {
          setShowNotifications(false)
          setShowUserManagement(true)
        }}
        onOpenAnnouncements={() => {
          setShowNotifications(false)
          setShowAnnouncementManagement(true)
        }}
        onOpenInquiries={() => {
          setShowNotifications(false)
          setShowInquiryManagement(true)
        }}
        onOpenSurveyAnalytics={() => {
          setShowNotifications(false)
          setShowSurveyDashboard(true)
        }}
        onLogout={onLogout}
      />

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

      <TicketStatusCards
        counts={{
          submitted: submittedCount,
          inProgress: inProgressCount,
          waiting: waitingCount,
          resolved: resolvedCount,
          urgent: urgentCount,
          nearSla: nearSlaCount,
          overdue: overdueCount,
          myTickets: myTicketsCount,
        }}
        onSelect={(cardKey) => {
          setStatusFilter('All')
          setPriorityFilter('All')
          setSlaFilter('All')
          setShowMyTickets(false)

          if (cardKey === 'submitted') {
            setStatusFilter('Submitted')
          } else if (cardKey === 'inProgress') {
            setStatusFilter('In Progress')
          } else if (cardKey === 'waiting') {
            setStatusFilter('Waiting for Franchisee')
          } else if (cardKey === 'resolved') {
            setStatusFilter('Resolved')
          } else if (cardKey === 'urgent') {
            setPriorityFilter('Urgent')
          } else if (cardKey === 'nearSla') {
            setSlaFilter('Near SLA')
          } else if (cardKey === 'overdue') {
            setSlaFilter('Overdue')
          } else if (cardKey === 'myTickets') {
            setShowMyTickets(true)
          }
        }}
      />

      <section className="ticket-queue-section">
        <div className="ticket-queue-header">
          <div>
            <span className="ticket-queue-eyebrow">
              Customer Service Queue
            </span>

            <h2>
              {showMyTickets
                ? 'My Assigned Tickets'
                : 'All Franchisee Tickets'}
            </h2>

            <p>
              Monitor, prioritise, and resolve franchisee concerns from one workspace.
            </p>
          </div>

          <button
            type="button"
            className={`ticket-queue-toggle ${
              showMyTickets ? 'active' : ''
            }`}
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
        </div>

        <div className="ticket-queue-kpis">
          <article>
            <span>Visible Tickets</span>
            <strong>{filteredTickets.length}</strong>
          </article>

          <article>
            <span>In Progress</span>
            <strong>{inProgressCount}</strong>
          </article>

          <article>
            <span>Near SLA</span>
            <strong>{nearSlaCount}</strong>
          </article>

          <article className="attention">
            <span>Overdue</span>
            <strong>{overdueCount}</strong>
          </article>
        </div>

        <div className="filter-section ticket-queue-filters">
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

        

        <select
          value={slaFilter}
          onChange={(event) => {
            setSlaFilter(
              event.target.value
            )
          }}
        >
          <option value="All">
            All SLA Statuses
          </option>

          <option value="Near SLA">
            Near SLA
          </option>

          <option value="Overdue">
            Overdue
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

        <div className="recent-section ticket-queue-grid-wrap">
          <div className="ticket-queue-result-bar">
            <span>
              {showMyTickets
                ? 'Assigned to your account'
                : 'All tickets'}
            </span>

            <strong>
              {filteredTickets.length}{' '}
              {filteredTickets.length === 1
                ? 'result'
                : 'results'}
            </strong>
          </div>

          <div className="ticket-queue-grid-scroll">
            <div className="ticket-queue-grid-header">
              <span>Ticket No.</span>
              <span>Franchisee</span>
              <span>Location</span>
              <span>Concern</span>
              <span>Date Submitted</span>
              <span>Priority</span>
              <span>SLA</span>
              <span>Assigned To</span>
              <span>Status</span>
              <span>Action</span>
            </div>

            <div className="ticket-queue-grid-body">
              {filteredTickets.length === 0 ? (
                <div className="ticket-queue-empty">
                  {showMyTickets
                    ? 'No tickets are currently assigned to you.'
                    : 'No matching tickets found.'}
                </div>
              ) : (
                filteredTickets.map((ticket) => (
                  <div
                    className="ticket-queue-grid-row"
                    key={ticket.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setSelectedTicket(ticket)
                    }}
                    onKeyDown={(event) => {
                      if (
                        event.key === 'Enter' ||
                        event.key === ' '
                      ) {
                        setSelectedTicket(ticket)
                      }
                    }}
                  >
                    <div>
                      <span className="ticket-number-cell">
                        🎫 {ticket.ticket_number}
                      </span>
                    </div>

                    <div>
                      {ticket.franchisee_name || 'N/A'}
                    </div>

                    <div>
                      {ticket.location || 'N/A'}
                    </div>

                    <div className="ticket-concern-cell">
                      {ticket.subject}
                    </div>

                    <div>
                      {ticket.created_at
                        ? new Date(
                            ticket.created_at
                          ).toLocaleDateString()
                        : 'N/A'}
                    </div>

                    <div
                      onClick={(event) => {
                        event.stopPropagation()
                      }}
                    >
                      {ticket.priority_locked === true ? (
                        <span
                          className={getPriorityClass(
                            ticket.priority || 'Low'
                          )}
                        >
                          🔒 {ticket.priority || 'Low'}
                        </span>
                      ) : !ticket.assigned_to ? (
                        <span className="priority-badge">
                          Awaiting assignment
                        </span>
                      ) : isCustomerService &&
                        ticket.assigned_to ===
                          currentUserId ? (
                        <select
                          className={getPriorityClass(
                            ticket.priority || 'Low'
                          )}
                          defaultValue=""
                          onChange={(event) => {
                            const selectedPriority =
                              event.target.value

                            if (!selectedPriority) {
                              return
                            }

                            handlePriorityChange(
                              ticket.id,
                              selectedPriority
                            )
                          }}
                        >
                          <option value="" disabled>
                            Set Priority
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
                      ) : (
                        <span className="priority-badge">
                          Assigned CS only
                        </span>
                      )}
                    </div>

                    <div>
                      {(() => {
                        const sla = getSlaDisplay(
                          ticket,
                          currentTime
                        )

                        return (
                          <span className={sla.className}>
                            {sla.label}
                          </span>
                        )
                      })()}
                    </div>

                    <div>
                      {ticket.assigned_agent_name ||
                        'Unassigned'}
                    </div>

                    <div>
                      <span
                        className={`status-badge status-${String(
                          ticket.status || ''
                        )
                          .toLowerCase()
                          .replaceAll(' ', '-')}`}
                      >
                        {ticket.status}
                      </span>
                    </div>

                    <div
                      onClick={(event) => {
                        event.stopPropagation()
                      }}
                    >
                      <button
                        type="button"
                        className="ticket-open-button"
                        onClick={() => {
                          setSelectedTicket(ticket)
                        }}
                      >
                        Open →
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

export default AdminDashboard