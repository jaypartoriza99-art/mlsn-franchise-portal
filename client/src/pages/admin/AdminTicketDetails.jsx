import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

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

function AdminTicketDetails({ selectedTicket, onBack }) {
  const [reply, setReply] = useState('')
  const [messages, setMessages] = useState([])
  const [timeline, setTimeline] = useState([])
  const [attachment, setAttachment] = useState(null)
  const [fileInputKey, setFileInputKey] = useState(0)
  const [status, setStatus] = useState(
    selectedTicket?.status || 'Submitted'
  )
  const [assignedName, setAssignedName] = useState('Unassigned')
  const [assignedAt, setAssignedAt] = useState(
    selectedTicket?.assigned_at || null
  )
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isSavingStatus, setIsSavingStatus] = useState(false)
  const [isAssigning, setIsAssigning] = useState(false)
  const [currentUserId, setCurrentUserId] = useState(null)
  const [currentUserRole, setCurrentUserRole] = useState('')
  const [priority, setPriority] = useState(
    selectedTicket?.priority || 'Low'
  )
  const [priorityLocked, setPriorityLocked] = useState(
    selectedTicket?.priority_locked === true
  )
  const [prioritySetAt, setPrioritySetAt] = useState(
    selectedTicket?.priority_set_at || null
  )
  const [prioritySetByName, setPrioritySetByName] =
    useState('')
  const [slaDueAt, setSlaDueAt] = useState(
    selectedTicket?.sla_due_at || null
  )
  const [currentTime, setCurrentTime] =
    useState(new Date())

  const [internalNotes, setInternalNotes] =
    useState([])
  const [internalNote, setInternalNote] =
    useState('')
  const [isSavingNote, setIsSavingNote] =
    useState(false)

  useEffect(() => {
    if (!selectedTicket?.id) return

    fetchMessages()
    fetchAssignedPerson()
    fetchCurrentUser()
    fetchPrioritySetter()
    fetchInternalNotes()
    setStatus(selectedTicket.status || 'Submitted')
    setAssignedAt(selectedTicket.assigned_at || null)
    setPriority(selectedTicket.priority || 'Low')
    setPriorityLocked(
      selectedTicket.priority_locked === true
    )
    setPrioritySetAt(
      selectedTicket.priority_set_at || null
    )
    setSlaDueAt(
      selectedTicket.sla_due_at || null
    )

    const channel = supabase
      .channel(`admin-ticket-${selectedTicket.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ticket_messages',
          filter: `ticket_id=eq.${selectedTicket.id}`,
        },
        fetchMessages
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ticket_internal_notes',
          filter: `ticket_id=eq.${selectedTicket.id}`,
        },
        fetchInternalNotes
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedTicket?.id])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)

    return () => {
      clearInterval(timer)
    }
  }, [])

  useEffect(() => {
    if (!selectedTicket?.id) return

    const activities = []

    if (selectedTicket.created_at) {
      activities.push({
        id: `submitted-${selectedTicket.id}`,
        icon: '📝',
        title: 'Ticket Submitted',
        description: 'The franchisee submitted this concern.',
        date: selectedTicket.created_at,
      })
    }

    if (assignedAt) {
      activities.push({
        id: `assigned-${selectedTicket.id}`,
        icon: '👤',
        title: 'Ticket Assigned',
        description: `Assigned to ${assignedName}.`,
        date: assignedAt,
      })
    }

    if (priorityLocked && prioritySetAt) {
      activities.push({
        id: `priority-${selectedTicket.id}`,
        icon:
          priority === 'Urgent'
            ? '🚨'
            : '🎯',
        title: `Priority Set: ${priority}`,
        description:
          prioritySetByName
            ? `Priority was set by ${prioritySetByName}.`
            : 'The assigned Customer Service representative set the priority.',
        date: prioritySetAt,
      })
    }

    if (slaDueAt) {
      activities.push({
        id: `sla-${selectedTicket.id}`,
        icon: '⏰',
        title: 'SLA Deadline Set',
        description:
          `Target completion: ` +
          new Date(
            slaDueAt
          ).toLocaleString(),
        date:
          prioritySetAt ||
          selectedTicket.updated_at ||
          selectedTicket.created_at,
      })
    }

    messages.forEach((message) => {
      const isCustomerService =
        message.sender_type === 'customer_service'

      const senderName =
        message.profiles?.full_name ||
        message.profiles?.email ||
        (isCustomerService ? 'Customer Service' : 'Franchisee')

      activities.push({
        id: `message-${message.id}`,
        icon: isCustomerService ? '💬' : '🏪',
        title: isCustomerService
          ? 'Customer Service Replied'
          : 'Franchisee Replied',
        description: `Message sent by ${senderName}.`,
        date: message.created_at,
      })
    })

    activities.push({
      id: `status-${selectedTicket.id}-${status}`,
      icon:
        status === 'Resolved' || status === 'Closed'
          ? '✅'
          : status === 'In Progress'
          ? '🔄'
          : status === 'Waiting for Franchisee'
          ? '⏳'
          : '📌',
      title: `Current Status: ${status}`,
      description: 'This is the current ticket status.',
      date:
        selectedTicket.updated_at ||
        selectedTicket.created_at ||
        new Date().toISOString(),
    })

    activities.sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    )

    setTimeline(activities)
  }, [
    selectedTicket,
    messages,
    assignedAt,
    assignedName,
    status,
    priority,
    priorityLocked,
    prioritySetAt,
    prioritySetByName,
    slaDueAt,
  ])

  async function fetchCurrentUser() {
    const {
      data: userData,
      error: userError,
    } = await supabase.auth.getUser()

    const user = userData?.user

    if (userError || !user) {
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

    if (!profileError) {
      setCurrentUserRole(
        profileData?.role || ''
      )
    }
  }

  async function fetchPrioritySetter() {
    if (!selectedTicket?.priority_set_by) {
      setPrioritySetByName('')
      return
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq(
        'id',
        selectedTicket.priority_set_by
      )
      .single()

    if (error) {
      setPrioritySetByName(
        'Customer Service'
      )
      return
    }

    setPrioritySetByName(
      data.full_name ||
        data.email ||
        'Customer Service'
    )
  }

  async function fetchInternalNotes() {
    const { data, error } = await supabase
      .from('ticket_internal_notes')
      .select(`
        id,
        note,
        created_at,
        created_by,
        profiles:created_by (
          full_name,
          email,
          role
        )
      `)
      .eq('ticket_id', selectedTicket.id)
      .order('created_at', {
        ascending: false,
      })

    if (error) {
      console.error(
        'Error loading internal notes:',
        error
      )
      setErrorMessage(error.message)
      return
    }

    setInternalNotes(data || [])
  }

  async function handleAddInternalNote() {
    setErrorMessage('')
    setSuccessMessage('')

    if (!internalNote.trim()) {
      setErrorMessage(
        'Please enter an internal note first.'
      )
      return
    }

    setIsSavingNote(true)

    try {
      const {
        data: userData,
        error: userError,
      } = await supabase.auth.getUser()

      const user = userData?.user

      if (userError || !user) {
        setErrorMessage(
          'You must be logged in to add an internal note.'
        )
        return
      }

      const normalizedRole =
        currentUserRole
          ?.trim()
          .toLowerCase()

      if (
        ![
          'customer_service',
          'supervisor',
          'admin',
        ].includes(normalizedRole)
      ) {
        setErrorMessage(
          'You do not have permission to add internal notes.'
        )
        return
      }

      const { error } = await supabase
        .from('ticket_internal_notes')
        .insert([
          {
            ticket_id:
              selectedTicket.id,
            created_by: user.id,
            note: internalNote.trim(),
          },
        ])

      if (error) {
        setErrorMessage(error.message)
        return
      }

      setInternalNote('')
      setSuccessMessage(
        'Internal note added successfully. Internal notes are permanent and cannot be edited or deleted.'
      )

      await fetchInternalNotes()
    } finally {
      setIsSavingNote(false)
    }
  }

  async function fetchMessages() {
    const { data, error } = await supabase
      .from('ticket_messages')
      .select(`
        *,
        profiles:sender_id (
          full_name,
          email,
          role
        )
      `)
      .eq('ticket_id', selectedTicket.id)
      .order('created_at', { ascending: true })

    if (error) {
      setErrorMessage(error.message)
      return
    }

    setMessages(data || [])
  }

  async function fetchAssignedPerson() {
    if (!selectedTicket.assigned_to) {
      setAssignedName('Unassigned')
      return
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', selectedTicket.assigned_to)
      .single()

    if (error) {
      setAssignedName('Assigned')
      return
    }

    setAssignedName(
      data.full_name || data.email || 'Customer Service'
    )
  }

  async function createNotification({
    title,
    message,
    notificationType,
  }) {
    if (!selectedTicket?.user_id) return false

    const { error } = await supabase
      .from('notifications')
      .insert([
        {
          user_id: selectedTicket.user_id,
          ticket_id: selectedTicket.id,
          title,
          message,
          notification_type: notificationType,
          is_read: false,
        },
      ])

    return !error
  }

  async function handleAssignToMe() {
    setErrorMessage('')
    setSuccessMessage('')
    setIsAssigning(true)

    try {
      const {
        data: userData,
        error: userError,
      } = await supabase.auth.getUser()

      const user = userData?.user

      if (userError || !user) {
        setErrorMessage(
          'You must be logged in to assign this ticket.'
        )
        return
      }

      const normalizedRole =
        currentUserRole
          ?.trim()
          .toLowerCase()

      if (
        normalizedRole !==
        'customer_service'
      ) {
        setErrorMessage(
          'Only a Customer Service account can claim this ticket.'
        )
        return
      }

      if (selectedTicket.assigned_to) {
        setErrorMessage(
          'This ticket is already assigned.'
        )
        return
      }

      const now = new Date().toISOString()

      const {
        data,
        error,
      } = await supabase
        .from('tickets')
        .update({
          assigned_to: user.id,
          assigned_at: now,
          status: 'In Progress',
          updated_at: now,
        })
        .eq('id', selectedTicket.id)
        .is('assigned_to', null)
        .select(
          'assigned_to, assigned_at, status, updated_at'
        )
        .maybeSingle()

      if (error) {
        setErrorMessage(error.message)
        return
      }

      if (!data) {
        setErrorMessage(
          'This ticket was already assigned to another Customer Service representative.'
        )
        return
      }

      selectedTicket.assigned_to =
        data.assigned_to
      selectedTicket.assigned_at =
        data.assigned_at
      selectedTicket.status =
        data.status
      selectedTicket.updated_at =
        data.updated_at

      setCurrentUserId(user.id)
      setAssignedAt(data.assigned_at)
      setAssignedName('You')
      setStatus(data.status)

      const notificationCreated =
        await createNotification({
          title: 'Ticket Assigned',
          message:
            `Your ticket ${selectedTicket.ticket_number} ` +
            `has been assigned to Customer Service and is now being handled.`,
          notificationType:
            'ticket_assigned',
        })

      setSuccessMessage(
        notificationCreated
          ? 'Ticket assigned to you successfully.'
          : 'Ticket assigned, but the franchisee notification was not created.'
      )
    } finally {
      setIsAssigning(false)
    }
  }

  async function handleUpdateStatus() {
    setErrorMessage('')
    setSuccessMessage('')
    setIsSavingStatus(true)

    try {
      const now = new Date().toISOString()

      const { error } = await supabase
        .from('tickets')
        .update({
          status,
          updated_at: now,
        })
        .eq('id', selectedTicket.id)

      if (error) {
        setErrorMessage(error.message)
        return
      }

      selectedTicket.status = status
      selectedTicket.updated_at = now

      const notificationCreated =
        await createNotification({
          title: 'Ticket Status Updated',
          message:
            `Your ticket ${selectedTicket.ticket_number} ` +
            `is now ${status}.`,
          notificationType: 'status_update',
        })

      setSuccessMessage(
        notificationCreated
          ? 'Ticket status updated successfully.'
          : 'Status updated, but the notification was not created.'
      )
    } finally {
      setIsSavingStatus(false)
    }
  }

  async function handleSendReply() {
    setErrorMessage('')
    setSuccessMessage('')

    if (isTicketClosed) {
      setErrorMessage(
        'This ticket is already resolved or closed.'
      )
      return
    }

    if (!reply.trim() && !attachment) {
      setErrorMessage(
        'Please type a reply or attach a file first.'
      )
      return
    }

    setIsSending(true)

    try {
      const { data: userData, error: userError } =
        await supabase.auth.getUser()

      const user = userData?.user

      if (userError || !user) {
        setErrorMessage(
          'You must be logged in to send a reply.'
        )
        return
      }

      let attachmentUrl = null

      if (attachment) {
        const fileExtension =
          attachment.name.split('.').pop()?.toLowerCase() ||
          'file'

        const filePath =
          `${selectedTicket.id}/` +
          `${Date.now()}-${user.id}.${fileExtension}`

        const { error: uploadError } =
          await supabase.storage
            .from('ticket-attachments')
            .upload(filePath, attachment)

        if (uploadError) {
          setErrorMessage(uploadError.message)
          return
        }

        const { data: publicUrlData } =
          supabase.storage
            .from('ticket-attachments')
            .getPublicUrl(filePath)

        attachmentUrl = publicUrlData.publicUrl
      }

      const messageText =
        reply.trim() || 'Attachment sent.'

      const { error: messageError } = await supabase
        .from('ticket_messages')
        .insert([
          {
            ticket_id: selectedTicket.id,
            sender_id: user.id,
            sender_type: 'customer_service',
            message: messageText,
            attachment_url: attachmentUrl,
          },
        ])

      if (messageError) {
        setErrorMessage(messageError.message)
        return
      }

      if (!selectedTicket.assigned_to) {
        const now = new Date().toISOString()

        const { error: assignError } = await supabase
          .from('tickets')
          .update({
            assigned_to: user.id,
            assigned_at: now,
            status: 'In Progress',
            updated_at: now,
          })
          .eq('id', selectedTicket.id)

        if (assignError) {
          setErrorMessage(assignError.message)
          return
        }

        selectedTicket.assigned_to = user.id
        selectedTicket.assigned_at = now
        selectedTicket.status = 'In Progress'
        selectedTicket.updated_at = now

        setAssignedAt(now)
        setStatus('In Progress')
        await fetchAssignedPerson()
      }

      const notificationCreated =
        await createNotification({
          title: 'New Customer Service Reply',
          message:
            `Customer Service replied to ticket ` +
            `${selectedTicket.ticket_number}.`,
          notificationType: 'customer_service_reply',
        })

      setReply('')
      setAttachment(null)
      setFileInputKey((currentKey) => currentKey + 1)

      setSuccessMessage(
        notificationCreated
          ? 'Reply sent successfully.'
          : 'Reply sent, but the notification was not created.'
      )

      await fetchMessages()
    } finally {
      setIsSending(false)
    }
  }

  const isTicketClosed =
    status === 'Resolved' ||
    status === 'Closed'

  const slaDisplay = getSlaDisplay(
    {
      ...selectedTicket,
      status,
      priority_locked: priorityLocked,
      sla_due_at: slaDueAt,
    },
    currentTime
  )

  if (!selectedTicket) {
    return (
      <>
        <h1>Ticket Not Found</h1>
        <button onClick={onBack}>
          Back to Dashboard
        </button>
      </>
    )
  }

  return (
    <div className="admin-ticket-workspace">
      <section className="admin-ticket-hero">
        <div className="admin-ticket-hero-copy">
          <span className="admin-ticket-eyebrow">
  CUSTOMER SERVICE WORKSPACE
</span>

          <div className="admin-ticket-title-row">
            <h1>{selectedTicket.ticket_number}</h1>

            <span
              className={`admin-ticket-status status-${String(
                status
              )
                .toLowerCase()
                .replaceAll(' ', '-')}`}
            >
              {status}
            </span>
          </div>

          <p>{selectedTicket.subject}</p>
        </div>

        <button
          type="button"
          className="admin-ticket-back-button"
          onClick={onBack}
        >
          ← Back to Dashboard
        </button>
      </section>

      {errorMessage && (
        <div className="error-message admin-ticket-alert">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="success-message admin-ticket-alert">
          {successMessage}
        </div>
      )}

      <section className="admin-ticket-kpi-grid">
        <article className="admin-ticket-kpi">
          <span>Priority</span>
          <strong>
            {priorityLocked
              ? `🔒 ${priority}`
              : selectedTicket.assigned_to
              ? 'Awaiting assigned CS'
              : 'Awaiting assignment'}
          </strong>
        </article>

        <article className="admin-ticket-kpi">
          <span>Status</span>
          <strong>{status}</strong>
        </article>

        <article className="admin-ticket-kpi">
          <span>SLA</span>
          <strong className={slaDisplay.className}>
            {slaDisplay.label}
          </strong>

          {slaDueAt && (
            <small>
              Deadline:{' '}
              {new Date(
                slaDueAt
              ).toLocaleString()}
            </small>
          )}
        </article>

        <article className="admin-ticket-kpi">
          <span>Assigned Agent</span>
          <strong>{assignedName}</strong>

          {assignedAt && (
            <small>
              Since{' '}
              {new Date(
                assignedAt
              ).toLocaleString()}
            </small>
          )}
        </article>
      </section>

      <section className="admin-ticket-description-card">
        <span>Concern Description</span>
        <p>{selectedTicket.description}</p>
      </section>

      <div className="admin-ticket-workspace-grid">
        <main className="admin-ticket-main-column">
          <section className="admin-workspace-card admin-conversation-card">
            <div className="admin-section-heading">
              <div>
                <span>Communication</span>
                <h2>Conversation</h2>
              </div>

              <small>
                {messages.length}{' '}
                {messages.length === 1
                  ? 'message'
                  : 'messages'}
              </small>
            </div>

            <div className="chat-area admin-chat-area">
              {messages.length === 0 ? (
                <div className="admin-empty-state">
                  No conversation messages yet.
                </div>
              ) : (
                messages.map((message) => {
                  const isCustomerService =
                    message.sender_type ===
                    'customer_service'

                  const senderName =
                    message.profiles?.full_name ||
                    message.profiles?.email ||
                    (isCustomerService
                      ? 'Customer Service'
                      : 'Franchisee')

                  return (
                    <div
                      className={`chat-message ${
                        isCustomerService
                          ? 'customer-service'
                          : 'franchisee'
                      }`}
                      key={message.id}
                    >
                      <div className="avatar">
                        {isCustomerService
                          ? '👨‍💼'
                          : '🏪'}
                      </div>

                      <div
                        className={`chat-bubble ${
                          isCustomerService
                            ? 'cs'
                            : ''
                        }`}
                      >
                        <strong>{senderName}</strong>

                        <small>
                          {new Date(
                            message.created_at
                          ).toLocaleString()}
                        </small>

                        <p>{message.message}</p>

                        {message.attachment_url && (
                          <>
                            {/\.(jpg|jpeg|png|gif|webp)$/i.test(
                              message.attachment_url
                            ) ? (
                              <div className="admin-message-image-wrap">
                                <img
                                  src={
                                    message.attachment_url
                                  }
                                  alt="attachment"
                                  className="admin-message-image"
                                  onClick={() =>
                                    window.open(
                                      message.attachment_url,
                                      '_blank'
                                    )
                                  }
                                />
                              </div>
                            ) : (
                              <p className="admin-message-attachment">
                                📎{' '}
                                <a
                                  href={
                                    message.attachment_url
                                  }
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  View Attachment
                                </a>
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            <div className="admin-reply-composer">
              <div className="admin-section-heading compact">
                <div>
                  <span>Response</span>
                  <h2>Write a Reply</h2>
                </div>
              </div>

              {isTicketClosed && (
                <div className="success-message">
                  ✅ This ticket has already been resolved or closed.
                  Messaging is now disabled.
                </div>
              )}

              <textarea
                placeholder={
                  isTicketClosed
                    ? 'Messaging is disabled.'
                    : 'Type your reply here...'
                }
                value={reply}
                onChange={(event) =>
                  setReply(event.target.value)
                }
                disabled={isTicketClosed}
              />

              <div className="admin-composer-actions">
                <label className="admin-file-button">
                  📎 Attach File
                  <input
                    key={fileInputKey}
                    type="file"
                    disabled={isTicketClosed}
                    onChange={(event) =>
                      setAttachment(
                        event.target.files?.[0] ||
                          null
                      )
                    }
                  />
                </label>

                <button
                  type="button"
                  className="admin-send-button"
                  onClick={handleSendReply}
                  disabled={
                    isSending ||
                    isTicketClosed
                  }
                >
                  {isTicketClosed
                    ? 'Messaging Disabled'
                    : isSending
                    ? 'Sending...'
                    : 'Send Reply'}
                </button>
              </div>

              {attachment && !isTicketClosed && (
                <p className="admin-selected-file">
                  Selected file:{' '}
                  <strong>
                    {attachment.name}
                  </strong>
                </p>
              )}
            </div>
          </section>
        </main>

        <aside className="admin-ticket-side-column">
          <section className="admin-workspace-card">
            <div className="admin-section-heading">
              <div>
                <span>Ticket Controls</span>
                <h2>Assignment & Status</h2>
              </div>
            </div>

            <div className="admin-control-block">
              <label>Assigned Agent</label>
              <strong>{assignedName}</strong>

              {assignedAt && (
                <small>
                  Assigned since{' '}
                  {new Date(
                    assignedAt
                  ).toLocaleString()}
                </small>
              )}

              {!selectedTicket.assigned_to &&
                currentUserRole
                  ?.trim()
                  .toLowerCase() ===
                  'customer_service' && (
                  <button
                    type="button"
                    onClick={
                      handleAssignToMe
                    }
                    disabled={isAssigning}
                  >
                    {isAssigning
                      ? 'Assigning...'
                      : 'Assign to Me'}
                  </button>
                )}
            </div>

            <div className="admin-control-block">
              <label>Update Ticket Status</label>

              <select
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target.value
                  )
                }
              >
                <option>Submitted</option>
                <option>In Progress</option>
                <option>
                  Waiting for Franchisee
                </option>
                <option>Resolved</option>
                <option>Closed</option>
              </select>

              <button
                type="button"
                onClick={
                  handleUpdateStatus
                }
                disabled={
                  isSavingStatus
                }
              >
                {isSavingStatus
                  ? 'Saving...'
                  : 'Save Status'}
              </button>
            </div>
          </section>

          <section className="admin-workspace-card">
            <div className="admin-section-heading">
              <div>
                <span>Ticket History</span>
                <h2>Activity Timeline</h2>
              </div>

              <small>
                {timeline.length}{' '}
                {timeline.length === 1
                  ? 'activity'
                  : 'activities'}
              </small>
            </div>

            <div className="admin-timeline-list">
              {timeline.map((activity) => (
                <article
                  className="admin-timeline-item"
                  key={activity.id}
                >
                  <div className="admin-timeline-icon">
                    {activity.icon}
                  </div>

                  <div className="admin-timeline-content">
                    <strong>
                      {activity.title}
                    </strong>
                    <p>
                      {activity.description}
                    </p>
                    <small>
                      {new Date(
                        activity.date
                      ).toLocaleString()}
                    </small>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="admin-workspace-card">
            <div className="admin-section-heading">
              <div>
                <span>Private Collaboration</span>
                <h2>Internal Notes</h2>
              </div>

              <small>
                {internalNotes.length}{' '}
                {internalNotes.length === 1
                  ? 'note'
                  : 'notes'}
              </small>
            </div>

            <p className="admin-internal-warning">
              📝 Visible only to Customer Service,
              Supervisors, and Admins. Notes are permanent.
            </p>

            <div className="admin-internal-form">
              <textarea
                placeholder="Add a permanent internal note..."
                value={internalNote}
                onChange={(event) =>
                  setInternalNote(
                    event.target.value
                  )
                }
              />

              <button
                type="button"
                onClick={
                  handleAddInternalNote
                }
                disabled={
                  isSavingNote
                }
              >
                {isSavingNote
                  ? 'Saving Note...'
                  : 'Add Internal Note'}
              </button>
            </div>

            <div className="admin-internal-list">
              {internalNotes.length === 0 ? (
                <div className="admin-empty-state">
                  No internal notes yet.
                </div>
              ) : (
                internalNotes.map(
                  (noteItem) => {
                    const authorName =
                      noteItem.profiles
                        ?.full_name ||
                      noteItem.profiles
                        ?.email ||
                      'Authorized User'

                    return (
                      <article
                        className="admin-internal-note"
                        key={noteItem.id}
                      >
                        <div className="admin-internal-note-header">
                          <strong>
                            {authorName}
                          </strong>

                          <small>
                            {new Date(
                              noteItem.created_at
                            ).toLocaleString()}
                          </small>
                        </div>

                        <p>
                          {noteItem.note}
                        </p>
                      </article>
                    )
                  }
                )
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}

export default AdminTicketDetails