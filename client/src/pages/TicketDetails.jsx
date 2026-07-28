import { useEffect, useMemo, useState } from 'react'
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
  const [surveyRating, setSurveyRating] = useState(0)
  const [surveyFeedback, setSurveyFeedback] = useState('')
  const [existingSurvey, setExistingSurvey] = useState(null)
  const [isSubmittingSurvey, setIsSubmittingSurvey] =
    useState(false)
  const [surveyError, setSurveyError] = useState('')
  const [surveySuccess, setSurveySuccess] = useState('')

  useEffect(() => {
    if (!selectedTicket?.id) return

    setCurrentStatus(selectedTicket.status || 'Submitted')
    fetchMessages()
    fetchSatisfactionSurvey()

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
          const nextStatus =
            payload.new.status

          setCurrentStatus(nextStatus)

          if (
            nextStatus === 'Resolved' ||
            nextStatus === 'Closed'
          ) {
            setReply('')
            setAttachment(null)
            setFileInputKey(
              (currentKey) =>
                currentKey + 1
            )
            fetchSatisfactionSurvey()
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ticket_satisfaction_surveys',
          filter: `ticket_id=eq.${selectedTicket.id}`,
        },
        () => {
          fetchSatisfactionSurvey()
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

  async function fetchSatisfactionSurvey() {
    if (!selectedTicket?.id) return

    const { data, error } = await supabase
      .from('ticket_satisfaction_surveys')
      .select(
        'id, rating, feedback, created_at'
      )
      .eq('ticket_id', selectedTicket.id)
      .maybeSingle()

    if (error) {
      console.error(
        'Error loading satisfaction survey:',
        error
      )
      return
    }

    setExistingSurvey(data || null)
  }

  async function handleSubmitSurvey() {
    setSurveyError('')
    setSurveySuccess('')

    if (!isTicketClosed) {
      setSurveyError(
        'The survey is available only after the ticket is resolved or closed.'
      )
      return
    }

    if (
      surveyRating < 1 ||
      surveyRating > 5
    ) {
      setSurveyError(
        'Please select a rating from 1 to 5 stars.'
      )
      return
    }

    setIsSubmittingSurvey(true)

    try {
      const {
        data: userData,
        error: userError,
      } = await supabase.auth.getUser()

      const user = userData?.user

      if (userError || !user) {
        setSurveyError(
          'You must be logged in to submit feedback.'
        )
        return
      }

      const {
        data: ticketData,
        error: ticketError,
      } = await supabase
        .from('tickets')
        .select(
          'user_id, assigned_to, status'
        )
        .eq('id', selectedTicket.id)
        .single()

      if (ticketError || !ticketData) {
        setSurveyError(
          ticketError?.message ||
            'Unable to verify this ticket.'
        )
        return
      }

      if (ticketData.user_id !== user.id) {
        setSurveyError(
          'You are not authorized to rate this ticket.'
        )
        return
      }

      if (
        ticketData.status !== 'Resolved' &&
        ticketData.status !== 'Closed'
      ) {
        setCurrentStatus(ticketData.status)
        setSurveyError(
          'This ticket is not yet resolved or closed.'
        )
        return
      }

      const { data, error } = await supabase
        .from(
          'ticket_satisfaction_surveys'
        )
        .insert([
          {
            ticket_id:
              selectedTicket.id,
            franchisee_id: user.id,
            assigned_to:
              ticketData.assigned_to ||
              null,
            rating: surveyRating,
            feedback:
              surveyFeedback.trim() ||
              null,
          },
        ])
        .select(
          'id, rating, feedback, created_at'
        )
        .single()

      if (error) {
        if (error.code === '23505') {
          await fetchSatisfactionSurvey()
          setSurveyError(
            'Feedback has already been submitted for this ticket.'
          )
          return
        }

        setSurveyError(error.message)
        return
      }

      setExistingSurvey(data)
      setSurveyFeedback('')
      setSurveySuccess(
        'Thank you! Your feedback has been submitted successfully.'
      )
    } finally {
      setIsSubmittingSurvey(false)
    }
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

  const isTicketClosed =
    currentStatus === 'Resolved' ||
    currentStatus === 'Closed'

  const activityItems = useMemo(() => {
    const items = []

    if (selectedTicket?.created_at) {
      items.push({
        id: 'ticket-created',
        type: 'created',
        icon: '🟢',
        title: 'Ticket created',
        description: 'The concern was submitted to Customer Service.',
        createdAt: selectedTicket.created_at,
      })
    }

    messages.forEach((message) => {
      const isCustomerService =
        message.sender_type === 'customer_service'

      const senderName =
        message.profiles?.full_name ||
        message.profiles?.email ||
        (isCustomerService
          ? 'Customer Service'
          : 'Franchisee')

      items.push({
        id: `message-${message.id}`,
        type: message.attachment_url
          ? 'attachment'
          : 'message',
        icon: message.attachment_url
          ? '📎'
          : isCustomerService
          ? '💬'
          : '🏪',
        title: message.attachment_url
          ? `${senderName} added an attachment`
          : `${senderName} sent a message`,
        description: message.message,
        createdAt: message.created_at,
      })
    })

    if (isTicketClosed) {
      items.push({
        id: 'ticket-current-status',
        type: 'status',
        icon:
          currentStatus === 'Closed'
            ? '⚫'
            : '✅',
        title: `Ticket ${currentStatus.toLowerCase()}`,
        description:
          'This reflects the ticket’s current status. Exact historical status changes require an audit-log table.',
        createdAt:
          selectedTicket?.updated_at ||
          selectedTicket?.resolved_at ||
          null,
      })
    }

    if (existingSurvey) {
      items.push({
        id: `survey-${existingSurvey.id}`,
        type: 'survey',
        icon: '⭐',
        title: 'Satisfaction survey submitted',
        description: `${existingSurvey.rating} out of 5 stars`,
        createdAt: existingSurvey.created_at,
      })
    }

    return items.sort((a, b) => {
      if (!a.createdAt && !b.createdAt) return 0
      if (!a.createdAt) return 1
      if (!b.createdAt) return -1

      return (
        new Date(a.createdAt).getTime() -
        new Date(b.createdAt).getTime()
      )
    })
  }, [
    selectedTicket,
    messages,
    existingSurvey,
    currentStatus,
    isTicketClosed,
  ])

  const assignedAgentName =
    selectedTicket?.assigned_profile?.full_name ||
    selectedTicket?.assigned_to_profile?.full_name ||
    selectedTicket?.assigned_name ||
    selectedTicket?.assigned_to_name ||
    'Not yet assigned'

  async function handleSendReply() {
    setErrorMessage('')
    setSuccessMessage('')

    if (isTicketClosed) {
      setErrorMessage(
        'Messaging is disabled because this ticket is already resolved or closed.'
      )
      return
    }

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
    <div className="ticket-details-page">
      <section className="ticket-detail-hero">
        <div>
          <span className="ticket-detail-eyebrow">
            Customer Service Ticket
          </span>

          <div className="ticket-detail-title-row">
            <h1>{selectedTicket.ticketNo}</h1>

            <span
              className={`ticket-detail-status status-${String(
                currentStatus
              )
                .toLowerCase()
                .replaceAll(' ', '-')}`}
            >
              {currentStatus}
            </span>
          </div>

          <p>{selectedTicket.concern}</p>
        </div>

        <button
          type="button"
          className="ticket-hero-back-button"
          onClick={onBack}
        >
          ← Back to My Tickets
        </button>
      </section>

      <div className="ticket-details-card ticket-details-modern">
        <section className="ticket-summary-grid">


          <article>
            <span>Created</span>
            <strong>
              {selectedTicket.created_at
                ? new Date(
                    selectedTicket.created_at
                  ).toLocaleString()
                : 'Not available'}
            </strong>
          </article>

          <article>
            <span>Last Updated</span>
            <strong>
              {selectedTicket.updated_at
                ? new Date(
                    selectedTicket.updated_at
                  ).toLocaleString()
                : 'Not available'}
            </strong>
          </article>

          <article>
            <span>Current Status</span>
            <strong>{currentStatus}</strong>
          </article>
        </section>

        <section className="ticket-description-modern">
          <span>Concern Description</span>
          <p>{selectedTicket.description}</p>
        </section>

        <section className="ticket-activity-section">
          <div className="ticket-section-heading">
            <div>
              <span>Ticket History</span>
              <h2>Activity Timeline</h2>
            </div>

            <small>
              {activityItems.length}{' '}
              {activityItems.length === 1
                ? 'activity'
                : 'activities'}
            </small>
          </div>

          <div className="ticket-activity-list">
            {activityItems.length === 0 ? (
              <div className="ticket-empty-state">
                No activity is available yet.
              </div>
            ) : (
              activityItems.map((activity) => (
                <article
                  className={`ticket-activity-item activity-${activity.type}`}
                  key={activity.id}
                >
                  <div className="ticket-activity-icon">
                    {activity.icon}
                  </div>

                  <div className="ticket-activity-content">
                    <div className="ticket-activity-header">
                      <strong>{activity.title}</strong>

                      <time>
                        {activity.createdAt
                          ? new Date(
                              activity.createdAt
                            ).toLocaleString()
                          : 'Current status'}
                      </time>
                    </div>

                    {activity.description && (
                      <p>{activity.description}</p>
                    )}
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="ticket-conversation-section">
          <div className="ticket-section-heading">
            <div>
              <span>Communication</span>
              <h2>Conversation</h2>
            </div>

            <small>
              {messages.length + 1}{' '}
              {messages.length + 1 === 1
                ? 'message'
                : 'messages'}
            </small>
          </div>

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
          {isTicketClosed && (
            <div className="success-message">
              ✅ This ticket has already been resolved or closed.
              Messaging is now disabled.
            </div>
          )}

          <textarea
            placeholder={
              isTicketClosed
                ? 'Messaging is disabled for this ticket.'
                : 'Type your message here...'
            }
            value={reply}
            onChange={(event) =>
              setReply(event.target.value)
            }
            disabled={isTicketClosed}
          />

          <input
            key={fileInputKey}
            type="file"
            disabled={isTicketClosed}
            onChange={(event) =>
              setAttachment(
                event.target.files?.[0] || null
              )
            }
          />

          {attachment && !isTicketClosed && (
            <p>
              Selected file:{' '}
              <strong>{attachment.name}</strong>
            </p>
          )}

          <button
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

        </section>

        {isTicketClosed && (
          <div className="satisfaction-survey">
            <h2>Rate Our Support</h2>

            {existingSurvey ? (
              <div className="survey-thank-you">
                <div className="survey-stars submitted">
                  {Array.from(
                    { length: 5 },
                    (_, index) => (
                      <span
                        key={index}
                        className={
                          index <
                          existingSurvey.rating
                            ? 'active'
                            : ''
                        }
                      >
                        ★
                      </span>
                    )
                  )}
                </div>

                <strong>
                  Thank you for your feedback!
                </strong>

                <p>
                  You rated this support experience{' '}
                  {existingSurvey.rating} out of 5.
                </p>

                {existingSurvey.feedback && (
                  <div className="submitted-feedback">
                    <strong>Your comment</strong>
                    <p>
                      {existingSurvey.feedback}
                    </p>
                  </div>
                )}

                <small>
                  Submitted on{' '}
                  {new Date(
                    existingSurvey.created_at
                  ).toLocaleString()}
                </small>
              </div>
            ) : (
              <>
                <p>
                  How satisfied are you with the
                  support you received?
                </p>

                <div
                  className="survey-stars"
                  role="radiogroup"
                  aria-label="Support rating"
                >
                  {[1, 2, 3, 4, 5].map(
                    (ratingValue) => (
                      <button
                        key={ratingValue}
                        type="button"
                        className={
                          ratingValue <=
                          surveyRating
                            ? 'active'
                            : ''
                        }
                        onClick={() =>
                          setSurveyRating(
                            ratingValue
                          )
                        }
                        aria-label={`${ratingValue} star${
                          ratingValue > 1
                            ? 's'
                            : ''
                        }`}
                        aria-pressed={
                          surveyRating ===
                          ratingValue
                        }
                      >
                        ★
                      </button>
                    )
                  )}
                </div>

                <p className="survey-rating-label">
                  {surveyRating === 1
                    ? 'Very Dissatisfied'
                    : surveyRating === 2
                    ? 'Dissatisfied'
                    : surveyRating === 3
                    ? 'Neutral'
                    : surveyRating === 4
                    ? 'Satisfied'
                    : surveyRating === 5
                    ? 'Very Satisfied'
                    : 'Select your rating'}
                </p>

                <textarea
                  className="survey-feedback"
                  placeholder="Share additional comments (optional)"
                  value={surveyFeedback}
                  onChange={(event) =>
                    setSurveyFeedback(
                      event.target.value
                    )
                  }
                  maxLength={1000}
                />

                <small className="survey-character-count">
                  {surveyFeedback.length}/1000
                </small>

                {surveyError && (
                  <div className="error-message">
                    {surveyError}
                  </div>
                )}

                {surveySuccess && (
                  <div className="success-message">
                    {surveySuccess}
                  </div>
                )}

                <button
                  type="button"
                  className="submit-survey-button"
                  onClick={
                    handleSubmitSurvey
                  }
                  disabled={
                    isSubmittingSurvey ||
                    surveyRating === 0
                  }
                >
                  {isSubmittingSurvey
                    ? 'Submitting...'
                    : 'Submit Feedback'}
                </button>
              </>
            )}
          </div>
        )}

      </div>
    </div>
  )
}

export default TicketDetails