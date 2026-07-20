import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

function TicketDetails({ selectedTicket, onBack }) {
  const [reply, setReply] = useState('')
  const [messages, setMessages] = useState([])
  const [attachment, setAttachment] = useState(null)
  const [fileInputKey, setFileInputKey] = useState(0)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [currentStatus, setCurrentStatus] = useState(
    selectedTicket?.status || 'Submitted'
  )

  useEffect(() => {
    if (!selectedTicket?.id) return

    setCurrentStatus(selectedTicket.status || 'Submitted')
    fetchMessages()

    const channel = supabase
      .channel(`ticket-${selectedTicket.id}`)
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
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tickets',
          filter: `id=eq.${selectedTicket.id}`,
        },
        (payload) => {
          setCurrentStatus(payload.new.status)
        }
      )
      .subscribe((status, error) => {
        console.log('Franchisee realtime status:', status)

        if (error) {
          console.error('Franchisee realtime error:', error)
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedTicket?.id])

  async function fetchMessages() {
    setErrorMessage('')

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

  async function createCustomerServiceNotifications() {
    const { data: ticketData, error: ticketError } = await supabase
      .from('tickets')
      .select('assigned_to')
      .eq('id', selectedTicket.id)
      .single()

    if (ticketError) {
      console.error(
        'Error loading ticket assignment for notification:',
        ticketError
      )
      return false
    }

    let recipientIds = []

    if (ticketData?.assigned_to) {
      recipientIds = [ticketData.assigned_to]
    } else {
      const { data: recipients, error: recipientsError } = await supabase
        .from('profiles')
        .select('id')
        .in('role', ['customer_service', 'admin'])

      if (recipientsError) {
        console.error(
          'Error loading CS notification recipients:',
          recipientsError
        )
        return false
      }

      recipientIds = (recipients || []).map((recipient) => recipient.id)
    }

    if (recipientIds.length === 0) {
      console.warn('No Customer Service notification recipients found.')
      return false
    }

    const notifications = recipientIds.map((recipientId) => ({
      user_id: recipientId,
      ticket_id: selectedTicket.id,
      title: 'Franchisee Replied',
      message:
        `${selectedTicket.ticketNo} — ` +
        `${selectedTicket.concern}`,
      notification_type: 'franchisee_reply',
      is_read: false,
    }))

    const { error: notificationError } = await supabase
      .from('notifications')
      .insert(notifications)

    if (notificationError) {
      console.error(
        'Error creating Customer Service notifications:',
        notificationError
      )
      return false
    }

    return true
  }

  async function handleSendReply() {
    setErrorMessage('')
    setSuccessMessage('')

    if (!reply.trim() && !attachment) {
      setErrorMessage(
        'Please type a message or attach a file first.'
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
          'You must be logged in to send a message.'
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

        const { error: uploadError } = await supabase.storage
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

        const { data: publicUrlData } = supabase.storage
          .from('ticket-attachments')
          .getPublicUrl(filePath)

        attachmentUrl = publicUrlData.publicUrl
      }

      const newMessage = {
        ticket_id: selectedTicket.id,
        sender_id: user.id,
        sender_type: 'franchisee',
        message: reply.trim() || 'Attachment sent.',
        attachment_url: attachmentUrl,
      }

      const { error: messageError } = await supabase
        .from('ticket_messages')
        .insert([newMessage])

      if (messageError) {
        console.error(
          'Error sending message:',
          messageError
        )
        setErrorMessage(messageError.message)
        return
      }

      const notificationCreated =
        await createCustomerServiceNotifications()

      setReply('')
      setAttachment(null)
      setFileInputKey((currentKey) => currentKey + 1)

      setSuccessMessage(
        notificationCreated
          ? 'Message sent successfully.'
          : 'Message sent, but the notification was not created.'
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
          Back to My Tickets
        </button>
      </>
    )
  }

  return (
    <>
      <div className="page-header">
        <h1>{selectedTicket.ticketNo}</h1>
        <p>{selectedTicket.concern}</p>
      </div>

      <div className="ticket-details-card">
        <div className="ticket-info">
          <div>
            <strong>Department</strong>
            <p>{selectedTicket.department}</p>
          </div>

          <div>
            <strong>Priority</strong>
            <p>{selectedTicket.priority}</p>
          </div>

          <div>
            <strong>Status</strong>
            <p>{currentStatus}</p>
          </div>
        </div>

        <div className="ticket-description">
          <strong>Description</strong>
          <p>{selectedTicket.description}</p>
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
          <div className="chat-message franchisee">
            <div className="avatar">🏪</div>

            <div className="chat-bubble">
              <strong>Franchisee</strong>
              <small>Initial concern</small>
              <p>{selectedTicket.description}</p>
            </div>
          </div>

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
            placeholder="Type your message here..."
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
          ← Back to My Tickets
        </button>
      </div>
    </>
  )
}

export default TicketDetails