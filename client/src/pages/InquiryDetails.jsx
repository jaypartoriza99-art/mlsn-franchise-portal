import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

function InquiryDetails({
  inquiry,
  onBack,
  refresh,
}) {
  const [currentInquiry, setCurrentInquiry] =
    useState(inquiry)

  const [currentUser, setCurrentUser] =
    useState(null)

  const [currentUserRole, setCurrentUserRole] =
    useState('')

  const [handlerName, setHandlerName] =
    useState('Unassigned')

  const [notes, setNotes] = useState([])
  const [newNote, setNewNote] = useState('')

  const [staffList, setStaffList] =
    useState([])

  const [selectedHandler, setSelectedHandler] =
    useState('')

  const [errorMessage, setErrorMessage] =
    useState('')

  const [successMessage, setSuccessMessage] =
    useState('')

  const [isLoading, setIsLoading] =
    useState(true)

  const [isUpdating, setIsUpdating] =
    useState(false)

  const [isSavingNote, setIsSavingNote] =
    useState(false)

  const [isReassigning, setIsReassigning] =
    useState(false)

  useEffect(() => {
    initializeInquiry()
  }, [inquiry.id])

  async function initializeInquiry() {
    setIsLoading(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const {
        data: userData,
        error: userError,
      } = await supabase.auth.getUser()

      const user = userData?.user

      if (userError || !user) {
        setErrorMessage(
          'Unable to identify your staff account.'
        )
        return
      }

      setCurrentUser(user)

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
          'Error loading staff role:',
          profileError
        )

        setErrorMessage(
          'Unable to determine your account permissions.'
        )
        return
      }

      const role = profileData?.role || ''

      setCurrentUserRole(role)

      await reloadInquiry()
      await fetchNotes()

      if (
        role === 'admin' ||
        role === 'supervisor'
      ) {
        await loadStaffMembers()
      }
    } catch (error) {
      console.error(
        'Inquiry initialization error:',
        error
      )

      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to load the inquiry.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  async function loadHandlerName(handlerId) {
    if (!handlerId) {
      setHandlerName('Unassigned')
      return
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', handlerId)
      .single()

    if (error) {
      console.error(
        'Error loading inquiry handler:',
        error
      )

      setHandlerName('Assigned Staff')
      return
    }

    setHandlerName(
      data?.full_name ||
        data?.email ||
        'Assigned Staff'
    )
  }

  async function reloadInquiry() {
    const { data, error } = await supabase
      .from('franchise_inquiries')
      .select('*')
      .eq('id', inquiry.id)
      .single()

    if (error) {
      console.error(
        'Error refreshing inquiry:',
        error
      )

      setErrorMessage(error.message)
      return null
    }

    setCurrentInquiry(data)

    setSelectedHandler(
      data.handled_by || ''
    )

    await loadHandlerName(data.handled_by)

    return data
  }

  async function loadStaffMembers() {
    const { data, error } = await supabase
      .from('profiles')
      .select(
        'id, full_name, email, role'
      )
      .in('role', [
        'customer_service',
        'supervisor',
        'admin',
      ])
      .order('full_name', {
        ascending: true,
      })

    if (error) {
      console.error(
        'Error loading staff members:',
        error
      )

      setErrorMessage(
        'Unable to load the staff list.'
      )
      return
    }

    setStaffList(data || [])
  }

  async function fetchNotes() {
    const { data, error } = await supabase
      .from('inquiry_notes')
      .select('*')
      .eq('inquiry_id', inquiry.id)
      .order('created_at', {
        ascending: false,
      })

    if (error) {
      console.error(
        'Error loading inquiry notes:',
        error
      )

      setErrorMessage(error.message)
      return
    }

    const noteData = data || []

    const authorIds = [
      ...new Set(
        noteData
          .map((note) => note.author_id)
          .filter(Boolean)
      ),
    ]

    const authorMap = {}

    if (authorIds.length > 0) {
      const {
        data: profiles,
        error: profilesError,
      } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', authorIds)

      if (profilesError) {
        console.error(
          'Error loading note authors:',
          profilesError
        )
      } else {
        ;(profiles || []).forEach(
          (profile) => {
            authorMap[profile.id] =
              profile.full_name ||
              profile.email ||
              'Staff Member'
          }
        )
      }
    }

    const notesWithAuthors = noteData.map(
      (note) => ({
        ...note,
        author_name: note.author_id
          ? authorMap[note.author_id] ||
            'Staff Member'
          : 'Former Staff Member',
      })
    )

    setNotes(notesWithAuthors)
  }

  async function ensureOwnership() {
    if (!currentUser) {
      setErrorMessage(
        'Unable to identify your staff account.'
      )
      return false
    }

    const hasFullAccess =
      currentUserRole === 'admin' ||
      currentUserRole === 'supervisor'

    if (hasFullAccess) {
      return true
    }

    if (currentUserRole !== 'customer_service') {
      setErrorMessage(
        'Your account is not allowed to manage this inquiry.'
      )
      return false
    }

    if (
      currentInquiry.handled_by ===
      currentUser.id
    ) {
      return true
    }

    if (currentInquiry.handled_by) {
      setErrorMessage(
        `This inquiry is currently handled by ${handlerName}.`
      )
      return false
    }

    const {
      data: claimedRows,
      error: claimError,
    } = await supabase
      .from('franchise_inquiries')
      .update({
        handled_by: currentUser.id,
        handled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', currentInquiry.id)
      .is('handled_by', null)
      .select('*')

    if (claimError) {
      console.error(
        'Error claiming inquiry:',
        claimError
      )

      setErrorMessage(claimError.message)
      return false
    }

    if (claimedRows?.length > 0) {
      const claimedInquiry = claimedRows[0]

      setCurrentInquiry(claimedInquiry)
      setSelectedHandler(currentUser.id)

      await loadHandlerName(currentUser.id)
      await refresh()

      return true
    }

    const latestInquiry =
      await reloadInquiry()

    if (
      latestInquiry?.handled_by ===
      currentUser.id
    ) {
      return true
    }

    setErrorMessage(
      'This inquiry was assigned to another staff member.'
    )

    return false
  }

  async function handleSaveNote(event) {
    event.preventDefault()

    setErrorMessage('')
    setSuccessMessage('')

    if (!newNote.trim()) {
      setErrorMessage(
        'Please enter an internal note.'
      )
      return
    }

    setIsSavingNote(true)

    try {
      const canProceed =
        await ensureOwnership()

      if (!canProceed) {
        return
      }

      const { error } = await supabase
        .from('inquiry_notes')
        .insert([
          {
            inquiry_id:
              currentInquiry.id,
            author_id:
              currentUser.id,
            note: newNote.trim(),
          },
        ])

      if (error) {
        console.error(
          'Error saving inquiry note:',
          error
        )

        setErrorMessage(error.message)
        return
      }

      setNewNote('')

      setSuccessMessage(
        'Internal note saved successfully.'
      )

      await fetchNotes()
      await reloadInquiry()
      await refresh()
    } catch (error) {
      console.error(
        'Unexpected note error:',
        error
      )

      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to save the note.'
      )
    } finally {
      setIsSavingNote(false)
    }
  }

  async function updateStatus(status) {
    setErrorMessage('')
    setSuccessMessage('')
    setIsUpdating(true)

    try {
      const canProceed =
        await ensureOwnership()

      if (!canProceed) {
        return
      }

      const { error } = await supabase
        .from('franchise_inquiries')
        .update({
          status,
          updated_at:
            new Date().toISOString(),
        })
        .eq('id', currentInquiry.id)

      if (error) {
        console.error(
          'Error updating inquiry:',
          error
        )

        setErrorMessage(error.message)
        return
      }

      setCurrentInquiry(
        (currentValue) => ({
          ...currentValue,
          status,
        })
      )

      setSuccessMessage(
        `Inquiry status updated to ${status}.`
      )

      await refresh()
      await reloadInquiry()
    } catch (error) {
      console.error(
        'Unexpected inquiry update error:',
        error
      )

      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to update the inquiry.'
      )
    } finally {
      setIsUpdating(false)
    }
  }

  async function reassignInquiry() {
    setErrorMessage('')
    setSuccessMessage('')

    if (!hasFullAccess) {
      setErrorMessage(
        'Only supervisors and administrators can reassign inquiries.'
      )
      return
    }

    if (!selectedHandler) {
      setErrorMessage(
        'Please select a staff member.'
      )
      return
    }

    if (
      selectedHandler ===
      currentInquiry.handled_by
    ) {
      setErrorMessage(
        'This inquiry is already assigned to the selected staff member.'
      )
      return
    }

    setIsReassigning(true)

    try {
      const now = new Date().toISOString()

      const { error } = await supabase
        .from('franchise_inquiries')
        .update({
          handled_by: selectedHandler,
          handled_at: now,
          updated_at: now,
        })
        .eq('id', currentInquiry.id)

      if (error) {
        console.error(
          'Error reassigning inquiry:',
          error
        )

        setErrorMessage(error.message)
        return
      }

      const selectedStaff =
        staffList.find(
          (staff) =>
            staff.id === selectedHandler
        )

      const selectedStaffName =
        selectedStaff?.full_name ||
        selectedStaff?.email ||
        'Selected staff member'

      if (currentUser?.id) {
        const { error: noteError } =
          await supabase
            .from('inquiry_notes')
            .insert([
              {
                inquiry_id:
                  currentInquiry.id,
                author_id:
                  currentUser.id,
                note:
                  `Inquiry reassigned to ${selectedStaffName}.`,
              },
            ])

        if (noteError) {
          console.error(
            'Unable to record reassignment note:',
            noteError
          )
        }
      }

      setSuccessMessage(
        `Inquiry reassigned to ${selectedStaffName}.`
      )

      await reloadInquiry()
      await fetchNotes()
      await refresh()
    } catch (error) {
      console.error(
        'Unexpected reassignment error:',
        error
      )

      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to reassign the inquiry.'
      )
    } finally {
      setIsReassigning(false)
    }
  }

  async function removeHandler() {
    setErrorMessage('')
    setSuccessMessage('')

    if (!hasFullAccess) {
      setErrorMessage(
        'Only supervisors and administrators can remove an inquiry handler.'
      )
      return
    }

    setIsReassigning(true)

    try {
      const { error } = await supabase
        .from('franchise_inquiries')
        .update({
          handled_by: null,
          handled_at: null,
          updated_at:
            new Date().toISOString(),
        })
        .eq('id', currentInquiry.id)

      if (error) {
        console.error(
          'Error removing inquiry handler:',
          error
        )

        setErrorMessage(error.message)
        return
      }

      if (currentUser?.id) {
        const { error: noteError } =
          await supabase
            .from('inquiry_notes')
            .insert([
              {
                inquiry_id:
                  currentInquiry.id,
                author_id:
                  currentUser.id,
                note:
                  'Inquiry handler was removed. The inquiry is now unassigned.',
              },
            ])

        if (noteError) {
          console.error(
            'Unable to record handler removal:',
            noteError
          )
        }
      }

      setSelectedHandler('')

      setSuccessMessage(
        'The inquiry is now unassigned.'
      )

      await reloadInquiry()
      await fetchNotes()
      await refresh()
    } catch (error) {
      console.error(
        'Unexpected handler removal error:',
        error
      )

      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to remove the inquiry handler.'
      )
    } finally {
      setIsReassigning(false)
    }
  }

  const hasFullAccess =
    currentUserRole === 'admin' ||
    currentUserRole === 'supervisor'

  const isCurrentHandler =
    currentInquiry.handled_by ===
    currentUser?.id

  const canManageInquiry =
    hasFullAccess ||
    !currentInquiry.handled_by ||
    isCurrentHandler

  const isBusy =
    isUpdating ||
    isSavingNote ||
    isReassigning

  if (isLoading) {
    return (
      <div className="page-header">
        <h1>Inquiry Details</h1>
        <p>Loading inquiry information...</p>
      </div>
    )
  }

  return (
    <>
      <div className="page-header">
        <h1>Inquiry Details</h1>

        <p>
          Review and manage the complete
          franchise inquiry information.
        </p>
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

      <div className="notification-card inquiry-details-card">
        <h2>{currentInquiry.full_name}</h2>

        <p>
          <strong>Date Submitted:</strong>{' '}
          {new Date(
            currentInquiry.created_at
          ).toLocaleString()}
        </p>

        <p>
          <strong>Interested Concept:</strong>{' '}
          {currentInquiry.interested_concept}
        </p>

        <p>
          <strong>Contact Number:</strong>{' '}
          {currentInquiry.contact_number}
        </p>

        <p>
          <strong>Email Address:</strong>{' '}
          {currentInquiry.email ||
            'Not provided'}
        </p>

        <p>
          <strong>Preferred Location:</strong>{' '}
          {currentInquiry.location}
        </p>

        <p>
          <strong>Estimated Budget:</strong>{' '}
          {currentInquiry.budget_range ||
            'Not provided'}
        </p>

        <p>
          <strong>Handled By:</strong>{' '}
          {handlerName}
        </p>

        {currentInquiry.handled_at && (
          <p>
            <strong>
              Ownership Started:
            </strong>{' '}
            {new Date(
              currentInquiry.handled_at
            ).toLocaleString()}
          </p>
        )}

        {hasFullAccess && (
          <div className="inquiry-reassign-section">
            <h3>Reassign Inquiry</h3>

            <div className="inquiry-reassign-controls">
              <select
                value={selectedHandler}
                onChange={(event) =>
                  setSelectedHandler(
                    event.target.value
                  )
                }
                disabled={isBusy}
              >
                <option value="">
                  Select staff member
                </option>

                {staffList.map((staff) => (
                  <option
                    key={staff.id}
                    value={staff.id}
                  >
                    {staff.full_name ||
                      staff.email}
                    {' — '}
                    {staff.role ===
                    'customer_service'
                      ? 'Customer Service'
                      : staff.role ===
                          'supervisor'
                        ? 'Supervisor'
                        : 'Administrator'}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={reassignInquiry}
                disabled={isBusy}
              >
                {isReassigning
                  ? 'Saving...'
                  : 'Reassign'}
              </button>

              {currentInquiry.handled_by && (
                <button
                  type="button"
                  className="back-button"
                  onClick={removeHandler}
                  disabled={isBusy}
                >
                  Remove Handler
                </button>
              )}
            </div>
          </div>
        )}

        <p>
          <strong>Client Message:</strong>
        </p>

        <p>
          {currentInquiry.message ||
            'No message provided.'}
        </p>

        <p>
          <strong>Current Status:</strong>{' '}
          {currentInquiry.status}
        </p>

        {!canManageInquiry && (
          <div className="error-message">
            This inquiry is already assigned to{' '}
            {handlerName}. You can review the
            details and notes, but only the
            assigned handler, supervisor, or
            administrator can make changes.
          </div>
        )}

        <div className="inquiry-status-actions">
          <button
            type="button"
            onClick={() =>
              updateStatus('Contacted')
            }
            disabled={
              isBusy ||
              !canManageInquiry
            }
          >
            Mark Contacted
          </button>

          <button
            type="button"
            onClick={() =>
              updateStatus('Interested')
            }
            disabled={
              isBusy ||
              !canManageInquiry
            }
          >
            Mark Interested
          </button>

          <button
            type="button"
            onClick={() =>
              updateStatus('Closed Sale')
            }
            disabled={
              isBusy ||
              !canManageInquiry
            }
          >
            Mark Closed Sale
          </button>

          <button
            type="button"
            onClick={() =>
              updateStatus('Not Interested')
            }
            disabled={
              isBusy ||
              !canManageInquiry
            }
          >
            Mark Not Interested
          </button>
        </div>
      </div>

      <div className="inquiry-notes-section">
        <h2>Activity History</h2>

        <p className="inquiry-notes-description">
          Internal notes are visible only to
          authorized MLSN staff.
        </p>

        <form
          className="inquiry-note-form"
          onSubmit={handleSaveNote}
        >
          <label htmlFor="internal-note">
            Add Internal Note
          </label>

          <textarea
            id="internal-note"
            value={newNote}
            onChange={(event) =>
              setNewNote(event.target.value)
            }
            placeholder="Example: Called the client and sent the package details."
            rows="4"
            disabled={
              isBusy ||
              !canManageInquiry
            }
          />

          <button
            type="submit"
            disabled={
              isBusy ||
              !canManageInquiry
            }
          >
            {isSavingNote
              ? 'Saving Note...'
              : 'Save Internal Note'}
          </button>
        </form>

        <div className="inquiry-note-list">
          {notes.length === 0 ? (
            <p>No internal notes recorded yet.</p>
          ) : (
            notes.map((note) => (
              <div
                className="inquiry-note-card"
                key={note.id}
              >
                <div className="inquiry-note-header">
                  <strong>
                    {note.author_name}
                  </strong>

                  <small>
                    {new Date(
                      note.created_at
                    ).toLocaleString()}
                  </small>
                </div>

                <p>{note.note}</p>
              </div>
            ))
          )}
        </div>
      </div>

      <button
        type="button"
        className="back-button"
        onClick={onBack}
        disabled={isBusy}
      >
        ← Back to Inquiries
      </button>
    </>
  )
}

export default InquiryDetails