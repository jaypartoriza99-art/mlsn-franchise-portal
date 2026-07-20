import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import InquiryDetails from './InquiryDetails'

function InquiryManagement({ onBack }) {
  const [inquiries, setInquiries] = useState([])

  const [selectedInquiry, setSelectedInquiry] =
    useState(null)

  const [errorMessage, setErrorMessage] =
    useState('')

  const [isLoading, setIsLoading] =
    useState(true)

  useEffect(() => {
    fetchInquiries()
  }, [])

  async function fetchInquiries() {
    setIsLoading(true)
    setErrorMessage('')

    const { data, error } = await supabase
      .from('franchise_inquiries')
      .select('*')
      .order('created_at', {
        ascending: false,
      })

    if (error) {
      console.error(
        'Error loading franchise inquiries:',
        error
      )

      setErrorMessage(error.message)
      setIsLoading(false)
      return
    }

    const inquiryData = data || []

    const handlerIds = [
      ...new Set(
        inquiryData
          .map((inquiry) => inquiry.handled_by)
          .filter(Boolean)
      ),
    ]

    const handlerMap = {}

    if (handlerIds.length > 0) {
      const {
        data: profiles,
        error: profilesError,
      } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', handlerIds)

      if (profilesError) {
        console.error(
          'Error loading inquiry handlers:',
          profilesError
        )
      } else {
        ;(profiles || []).forEach((profile) => {
          handlerMap[profile.id] =
            profile.full_name ||
            profile.email ||
            'Assigned Staff'
        })
      }
    }

    const inquiriesWithHandlers =
      inquiryData.map((inquiry) => ({
        ...inquiry,
        handler_name: inquiry.handled_by
          ? handlerMap[inquiry.handled_by] ||
            'Assigned Staff'
          : 'Unassigned',
      }))

    setInquiries(inquiriesWithHandlers)
    setIsLoading(false)
  }

  async function updateStatus(id, status) {
    setErrorMessage('')

    const { error } = await supabase
      .from('franchise_inquiries')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      console.error(
        'Error updating inquiry status:',
        error
      )

      setErrorMessage(error.message)
      return
    }

    await fetchInquiries()
  }

  const newCount = inquiries.filter(
    (inquiry) => inquiry.status === 'New'
  ).length

  const contactedCount = inquiries.filter(
    (inquiry) => inquiry.status === 'Contacted'
  ).length

  const interestedCount = inquiries.filter(
    (inquiry) => inquiry.status === 'Interested'
  ).length

  const closedSaleCount = inquiries.filter(
    (inquiry) => inquiry.status === 'Closed Sale'
  ).length

  const notInterestedCount = inquiries.filter(
    (inquiry) =>
      inquiry.status === 'Not Interested'
  ).length

  if (selectedInquiry) {
    return (
      <InquiryDetails
        inquiry={selectedInquiry}
        refresh={fetchInquiries}
        onBack={() => {
          setSelectedInquiry(null)
        }}
      />
    )
  }

  return (
    <>
      <div className="page-header">
        <h1>Franchise Inquiries</h1>

        <p>
          Manage website inquiries and potential
          franchise leads.
        </p>
      </div>

      {errorMessage && (
        <div className="error-message">
          {errorMessage}
        </div>
      )}

      <div className="inquiry-stats">
        <div className="stat-card">
          <span className="stat-icon">🟡</span>
          <h2>{newCount}</h2>
          <p>New Leads</p>
        </div>

        <div className="stat-card">
          <span className="stat-icon">🔵</span>
          <h2>{contactedCount}</h2>
          <p>Contacted</p>
        </div>

        <div className="stat-card">
          <span className="stat-icon">🟣</span>
          <h2>{interestedCount}</h2>
          <p>Interested</p>
        </div>

        <div className="stat-card">
          <span className="stat-icon">🟢</span>
          <h2>{closedSaleCount}</h2>
          <p>Closed Sales</p>
        </div>

        <div className="stat-card">
          <span className="stat-icon">⚪</span>
          <h2>{notInterestedCount}</h2>
          <p>Not Interested</p>
        </div>
      </div>

      <div className="recent-section">
        <h2>All Franchise Inquiries</h2>

        {isLoading ? (
          <p>Loading inquiries...</p>
        ) : inquiries.length === 0 ? (
          <p>No franchise inquiries yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Name</th>
                <th>Concept</th>
                <th>Location</th>
                <th>Contact</th>
                <th>Handled By</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {inquiries.map((lead) => (
                <tr key={lead.id}>
                  <td>
                    {new Date(
                      lead.created_at
                    ).toLocaleDateString()}
                  </td>

                  <td>{lead.full_name}</td>

                  <td>
                    {lead.interested_concept}
                  </td>

                  <td>{lead.location}</td>

                  <td>
                    {lead.contact_number}
                  </td>

                  <td>
                    {lead.handler_name ||
                      'Unassigned'}
                  </td>

                  <td>
                    <select
                      value={lead.status}
                      onChange={(event) =>
                        updateStatus(
                          lead.id,
                          event.target.value
                        )
                      }
                    >
                      <option value="New">
                        New
                      </option>

                      <option value="Contacted">
                        Contacted
                      </option>

                      <option value="Interested">
                        Interested
                      </option>

                      <option value="Closed Sale">
                        Closed Sale
                      </option>

                      <option value="Not Interested">
                        Not Interested
                      </option>
                    </select>
                  </td>

                  <td>
                    <button
                      type="button"
                      className="view-button"
                      onClick={() => {
                        setSelectedInquiry(lead)
                      }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <button
          type="button"
          className="back-button"
          onClick={onBack}
        >
          ← Back
        </button>
      </div>
    </>
  )
}

export default InquiryManagement