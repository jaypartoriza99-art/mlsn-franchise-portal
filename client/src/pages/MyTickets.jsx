import { useEffect } from 'react'
import { supabase } from '../lib/supabase'

function MyTickets({
  tickets,
  setTickets,
  setSelectedTicket,
  setActivePage,
}) {
  useEffect(() => {
    const channel = supabase
      .channel('my-tickets-realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tickets',
        },
        (payload) => {
          const updatedTicket = payload.new

          setTickets((currentTickets) =>
            currentTickets.map((ticket) =>
              ticket.id === updatedTicket.id
                ? {
                    ...ticket,
                    ticketNo: updatedTicket.ticket_number,
                    concern: updatedTicket.subject,
                    department: updatedTicket.category,
                    priority: updatedTicket.priority,
                    description: updatedTicket.description,
                    status: updatedTicket.status,
                  }
                : ticket
            )
          )
        }
      )
      .subscribe((status) => {
        console.log('My Tickets realtime status:', status)
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [setTickets])

  return (
    <>
      <div className="page-header">
        <h1>My Tickets</h1>
        <p>View and track all submitted concerns.</p>
      </div>

      <div className="recent-section">
        <table>
          <thead>
            <tr>
              <th>Ticket No.</th>
              <th>Concern</th>
              <th>Department</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {tickets.length === 0 ? (
              <tr>
                <td colSpan="4">No tickets found.</td>
              </tr>
            ) : (
              tickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  onClick={() => {
                    setSelectedTicket(ticket)
                    setActivePage('ticketDetails')
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <td>{ticket.ticketNo}</td>
                  <td>{ticket.concern}</td>
                  <td>{ticket.department}</td>
                  <td>{ticket.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}

export default MyTickets