import { useState } from 'react'
import { supabase } from '../lib/supabase'

function SubmitConcern({
  tickets,
  setTickets,
}) {
  const [category, setCategory] =
    useState('Marketing')

  const [priority, setPriority] =
    useState('Low')

  const [location, setLocation] =
    useState('')

  const [subject, setSubject] =
    useState('')

  const [description, setDescription] =
    useState('')

  const [
    successMessage,
    setSuccessMessage,
  ] = useState('')

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('')

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false)

  async function createCustomerServiceNotifications(
    ticket
  ) {
    const {
      data: recipients,
      error: recipientsError,
    } = await supabase
      .from('profiles')
      .select('id')
      .in('role', [
        'customer_service',
        'admin',
        'supervisor',
      ])

    if (recipientsError) {
      console.error(
        'Error loading Customer Service recipients:',
        recipientsError
      )

      return false
    }

    if (
      !recipients ||
      recipients.length === 0
    ) {
      console.warn(
        'No Customer Service notification recipients found.'
      )

      return false
    }

    const notifications =
      recipients.map((recipient) => ({
        user_id: recipient.id,
        ticket_id: ticket.id,
        title: 'New Ticket Submitted',
        message:
          `${ticket.ticket_number} — ` +
          `${ticket.subject} ` +
          `(${ticket.priority} priority)`,
        notification_type:
          'new_ticket',
        is_read: false,
      }))

    const {
      error: notificationError,
    } = await supabase
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

  async function handleSubmit() {
    setSuccessMessage('')
    setErrorMessage('')

    if (
      !location.trim() ||
      !subject.trim() ||
      !description.trim()
    ) {
      setErrorMessage(
        'Please complete the location, subject, and description.'
      )

      return
    }

    setIsSubmitting(true)

    try {
      const {
        data: userData,
        error: userError,
      } = await supabase.auth.getUser()

      const user = userData?.user

      if (userError || !user) {
        setErrorMessage(
          'You must be logged in to submit a concern.'
        )

        return
      }

      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error(
          'Error loading franchisee profile:',
          profileError
        )

        setErrorMessage(
          'Unable to load your franchisee information. Please contact Customer Service.'
        )

        return
      }

      const franchiseeName =
        profile?.full_name?.trim()

      if (!franchiseeName) {
        setErrorMessage(
          'Your franchisee name is missing from your profile. Please contact Customer Service.'
        )

        return
      }

      const ticketNo =
        `CS-${new Date().getFullYear()}-${Date.now()}`

      const newTicket = {
        ticket_number: ticketNo,
        user_id: user.id,
        franchisee_name:
          franchiseeName,
        location:
          location.trim(),
        category,
        priority,
        subject: subject.trim(),
        description:
          description.trim(),
        status: 'Submitted',
      }

      const {
        data,
        error,
      } = await supabase
        .from('tickets')
        .insert([newTicket])
        .select()
        .single()

      if (error) {
        console.error(
          'Supabase ticket error:',
          error
        )

        setErrorMessage(error.message)
        return
      }

      const localTicket = {
        id: data.id,
        ticketNo:
          data.ticket_number,
        ticket_number:
          data.ticket_number,
        franchisee_name:
          data.franchisee_name,
        location:
          data.location,
        concern: data.subject,
        subject: data.subject,
        department: data.category,
        category: data.category,
        priority: data.priority,
        description:
          data.description,
        status: data.status,
        created_at:
          data.created_at,
      }

      if (
        typeof setTickets ===
        'function'
      ) {
        setTickets(
          (currentTickets) => [
            localTicket,
            ...(currentTickets || []),
          ]
        )
      }

      const notificationsCreated =
        await createCustomerServiceNotifications(
          data
        )

      if (!notificationsCreated) {
        console.warn(
          'Ticket was submitted, but CS notifications were not created.'
        )
      }

      setSuccessMessage(
        `Concern submitted successfully. Ticket No: ${ticketNo}`
      )

      setLocation('')
      setSubject('')
      setDescription('')
      setPriority('Low')
      setCategory('Marketing')
    } catch (error) {
      console.error(
        'Unexpected ticket submission error:',
        error
      )

      setErrorMessage(
        'An unexpected error occurred while submitting your concern.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <div className="page-header">
        <h1>Submit Concern</h1>

        <p>
          Please fill out the form below
          to submit a concern.
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
        <label htmlFor="concern-category">
          Category
        </label>

        <select
          id="concern-category"
          value={category}
          onChange={(event) => {
            setCategory(
              event.target.value
            )
          }}
          disabled={isSubmitting}
        >
          <option value="Marketing">
            Marketing
          </option>

          <option value="Operations">
            Operations
          </option>

          <option value="Accounting">
            Accounting
          </option>

          <option value="Delivery">
            Delivery
          </option>

          <option value="Product Concern">
            Product Concern
          </option>

          <option value="Others">
            Others
          </option>
        </select>

        <label htmlFor="concern-priority">
          Priority
        </label>

        <select
          id="concern-priority"
          value={priority}
          onChange={(event) => {
            setPriority(
              event.target.value
            )
          }}
          disabled={isSubmitting}
        >
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

        <label htmlFor="concern-location">
          Franchise Location
        </label>

        <input
          id="concern-location"
          type="text"
          placeholder="Enter your franchise location"
          value={location}
          onChange={(event) => {
            setLocation(
              event.target.value
            )
          }}
          disabled={isSubmitting}
        />

        <label htmlFor="concern-subject">
          Subject
        </label>

        <input
          id="concern-subject"
          type="text"
          placeholder="Enter concern subject"
          value={subject}
          onChange={(event) => {
            setSubject(
              event.target.value
            )
          }}
          disabled={isSubmitting}
        />

        <label htmlFor="concern-description">
          Description
        </label>

        <textarea
          id="concern-description"
          placeholder="Please describe your concern"
          value={description}
          onChange={(event) => {
            setDescription(
              event.target.value
            )
          }}
          disabled={isSubmitting}
        />

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting
            ? 'Submitting...'
            : 'Submit Concern'}
        </button>
      </div>
    </>
  )
}

export default SubmitConcern