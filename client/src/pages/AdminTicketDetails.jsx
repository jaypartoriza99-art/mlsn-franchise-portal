import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

function AdminTicketDetails({ selectedTicket, onBack }) {
  const [reply, setReply] = useState('')
  const [messages, setMessages] = useState([])
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

  useEffect(() => {
    if (!selectedTicket?.id) return

    fetchMessages()
    fetchAssignedPerson()
    setStatus(selectedTicket.status || 'Submitted')
    setAssignedAt(selectedTicket.assigned_at || null)

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
        () => {
          fetchMessages()
        }
      )
      .subscribe((subscriptionStatus) => {
        console.log(
          'Admin realtime status:',
          subscriptionStatus
        )
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedTicket?.id])

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
      console.error('Error loading messages:', error)
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
      console.error('Error loading assigned agent:', error)
      setAssignedName('Assigned')
      return
    }

    setAssignedName(
      data.full_name ||
      data.email ||
      'Customer Service'
    )
  }

  async function createNotification({
    title,
    message,
    notificationType,
  }) {
    if (!selectedTicket?.user_id) {
      console.error(
        'Notification not created: ticket user_id is missing.'
      )
      return false
    }

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

    if (error) {
      console.error('Notification error:', error)
      return false
    }

    return true
  }

  async function handleUpdateStatus() {
    setErrorMessage('')
    setSuccessMessage('')
    setIsSavingStatus(true)

    try {
      const { error } = await supabase
        .from('tickets')
        .update({ status })
        .eq('id', selectedTicket.id)

      if (error) {
        setErrorMessage(error.message)
        return
      }

      selectedTicket.status = status

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
          attachment.name
            .split('.')
            .pop()
            ?.toLowerCase() || 'file'

        const filePath =
          `${selectedTicket.id}/` +
          `${Date.now()}-${user.id}.${fileExtension}`

        const { error: uploadError } =
          await supabase.storage
            .from('ticket-attachments')
            .upload(filePath, attachment)

        if (uploadError) {
          console.error(
            'Attachment upload error:',
            uploadError
          )
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
          })
          .eq('id', selectedTicket.id)

        if (assignError) {
          setErrorMessage(assignError.message)
          return
        }

        selectedTicket.assigned_to = user.id
        selectedTicket.assigned_at = now
        selectedTicket.status = 'In Progress'

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
    <>
      <div className="page-header">
        <h1>{selectedTicket.ticket_number}</h1>
        <p>{selectedTicket.subject}</p>
      </div>

      <div className="ticket-details-card">
        <div className="ticket-info">
          <div>
            <strong>Department</strong>
            <p>{selectedTicket.category}</p>
          </div>

          <div>
            <strong>Priority</strong>
            <p>{selectedTicket.priority}</p>
          </div>

          <div>
            <strong>Status</strong>
            <p>{status}</p>
          </div>
        </div>

        <div className="ticket-description">
          <strong>Description</strong>
          <p>{selectedTicket.description}</p>
        </div>

        <div className="reply-section">
          <h3>Assigned Agent</h3>

          <p>
            <strong>{assignedName}</strong>
          </p>

          {assignedAt && (
            <p>
              Assigned since:{' '}
              {new Date(assignedAt).toLocaleString()}
            </p>
          )}
        </div>

        <div className="reply-section">
          <h3>Update Ticket Status</h3>

          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value)
            }
          >
            <option>Submitted</option>
            <option>In Progress</option>
            <option>Waiting for Franchisee</option>
            <option>Resolved</option>
            <option>Closed</option>
          </select>

          <button
            onClick={handleUpdateStatus}
            disabled={isSavingStatus}
          >
            {isSavingStatus
              ? 'Saving...'
              : 'Save Status'}
          </button>
        </div>

        <hr />

        <h2>Conversation</h2>

        {errorMessage && (
          <div className="error-message">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="success-message">
            {successMessage}
          </div>
        )}

        <div className="chat-area">
          {messages.map((message) => {
            const isCustomerService =
              message.sender_type === 'customer_service'

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
                  {isCustomerService ? '👨‍💼' : '🏪'}
                </div>

                <div
                  className={`chat-bubble ${
                    isCustomerService ? 'cs' : ''
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
      <div style={{ marginTop: '10px' }}>
        <img
          src={message.attachment_url}
          alt="attachment"
          style={{
            maxWidth: '300px',
            maxHeight: '300px',
            borderRadius: '12px',
            cursor: 'pointer',
            border: '1px solid #ddd',
          }}
          onClick={() =>
            window.open(
              message.attachment_url,
              '_blank'
            )
          }
        />
      </div>
    ) : (
      <p>
        📎{' '}
        <a
          href={message.attachment_url}
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
          })}
        </div>

        <div className="reply-section">
          <textarea
            placeholder="Type your reply here..."
            value={reply}
            onChange={(event) =>
              setReply(event.target.value)
            }
          />

          <input
            key={fileInputKey}
            type="file"
            onChange={(event) =>
              setAttachment(
                event.target.files?.[0] || null
              )
            }
          />

          {attachment && (
            <p>
              Selected file:{' '}
              <strong>{attachment.name}</strong>
            </p>
          )}

          <button
            onClick={handleSendReply}
            disabled={isSending}
          >
            {isSending ? 'Sending...' : 'Send Reply'}
          </button>
        </div>

        <button
          className="back-button"
          onClick={onBack}
        >
          ← Back to Dashboard
        </button>
      </div>
    </>
  )
}

export default AdminTicketDetails