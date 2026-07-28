import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

function Dashboard({ tickets, userRole }) {
  const [fullName, setFullName] =
    useState('Franchisee')

  useEffect(() => {
    async function fetchProfile() {
      const {
        data: userData,
        error: userError,
      } = await supabase.auth.getUser()

      const user = userData?.user

      if (userError || !user) {
        console.error(
          'Unable to load dashboard user:',
          userError
        )
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error(
          'Unable to load franchisee name:',
          error
        )
        return
      }

      setFullName(
        data?.full_name || 'Franchisee'
      )
    }

    fetchProfile()
  }, [])

  const submitted = tickets.filter(
    (ticket) =>
      ticket.status === 'Submitted'
  ).length

  const inProgress = tickets.filter(
    (ticket) =>
      ticket.status === 'In Progress'
  ).length

  const waiting = tickets.filter(
    (ticket) =>
      ticket.status ===
      'Waiting for Franchisee'
  ).length

  const resolved = tickets.filter(
    (ticket) =>
      ticket.status === 'Resolved' ||
      ticket.status === 'Closed'
  ).length

  return (
    <>
      <div className="dashboard-header">
  <h1>
    {userRole === 'supervisor'
      ? '📊 Supervisor Dashboard'
      : userRole === 'customer_service'
      ? '📊 Customer Service Dashboard'
      : '📊 Franchisee Dashboard'}
  </h1>

  <p>Welcome back, {fullName}!</p>
</div>

      <div className="stats modern-stats">
        <div className="stat-card modern-card">
          <span className="stat-icon">
            🟡
          </span>

          <h3>Submitted</h3>
          <p>{submitted}</p>
        </div>

        <div className="stat-card modern-card">
          <span className="stat-icon">
            🔵
          </span>

          <h3>In Progress</h3>
          <p>{inProgress}</p>
        </div>

        <div className="stat-card modern-card">
          <span className="stat-icon">
            🟣
          </span>

          <h3>Waiting</h3>
          <p>{waiting}</p>
        </div>

        <div className="stat-card modern-card">
          <span className="stat-icon">
            🟢
          </span>

          <h3>Resolved</h3>
          <p>{resolved}</p>
        </div>
      </div>

      <div className="recent-section">
        <h2>Recent Tickets</h2>

        <table>
          <thead>
            <tr>
              <th>Ticket No.</th>
              <th>Concern</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {tickets.map((ticket) => (
              <tr key={ticket.ticketNo}>
                <td>{ticket.ticketNo}</td>
                <td>{ticket.concern}</td>
                <td>{ticket.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

export default Dashboard