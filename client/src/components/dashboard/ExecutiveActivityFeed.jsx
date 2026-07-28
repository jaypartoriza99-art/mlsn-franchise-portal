function formatRelativeTime(value) {
  if (!value) return 'Recently'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Recently'

  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000))
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`

  return date.toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
  })
}

function buildActivities(tickets = [], recentFranchisees = []) {
  const ticketActivities = tickets.slice(0, 8).map((ticket) => {
    const resolved =
      ticket.status === 'Resolved' ||
      ticket.status === 'Closed'

    const assigned = Boolean(ticket.assigned_to)

    let title = 'Ticket submitted'
    let icon = '🎫'
    let detail =
      ticket.subject ||
      ticket.category ||
      'Franchisee concern'

    if (resolved) {
      title = 'Ticket resolved'
      icon = '✅'
    } else if (assigned) {
      title = 'Ticket assigned'
      icon = '👤'
      detail = `${ticket.ticket_number || 'Ticket'} → ${
        ticket.assigned_agent_name || 'Customer Service'
      }`
    } else if (ticket.ticket_number) {
      detail = `${ticket.ticket_number} · ${detail}`
    }

    return {
      id: `ticket-${ticket.id}`,
      icon,
      title,
      detail,
      timestamp: ticket.updated_at || ticket.created_at,
    }
  })

  const franchiseActivities = recentFranchisees.map((item) => ({
    id: `franchisee-${item.id}`,
    icon: '🏪',
    title: 'New franchise registered',
    detail: [
      item.storeName,
      item.conceptName,
      item.location,
    ].filter(Boolean).join(' · '),
    timestamp: item.franchiseDate,
  }))

  return [...ticketActivities, ...franchiseActivities]
    .sort(
      (a, b) =>
        new Date(b.timestamp || 0).getTime() -
        new Date(a.timestamp || 0).getTime()
    )
    .slice(0, 7)
}

function ExecutiveActivityFeed({
  tickets = [],
  recentFranchisees = [],
}) {
  const activities = buildActivities(tickets, recentFranchisees)

  return (
    <article
      style={{
        background: '#fff',
        border: '1px solid #e7e2f2',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: '0 8px 24px rgba(52, 30, 86, 0.06)',
        minHeight: '360px',
      }}
    >
      <span style={{
        color: '#7b3fc6',
        fontSize: '11px',
        fontWeight: 800,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
      }}>
        Live Operations
      </span>

      <h2 style={{ margin: '5px 0 4px', fontSize: '20px' }}>
        Executive Activity
      </h2>

      <p style={{ margin: '0 0 10px', color: '#756d84', fontSize: '13px' }}>
        Recent franchise and customer-service activity.
      </p>

      {activities.length === 0 ? (
        <div style={{
          display: 'grid',
          placeItems: 'center',
          minHeight: '250px',
          color: '#8b829a',
          textAlign: 'center',
        }}>
          No recent activity is available yet.
        </div>
      ) : (
        activities.map((item, index) => (
          <div
            key={item.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '42px 1fr auto',
              gap: '12px',
              alignItems: 'start',
              padding: '14px 0',
              borderBottom:
                index === activities.length - 1
                  ? 'none'
                  : '1px solid #eeeaf6',
            }}
          >
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '13px',
              display: 'grid',
              placeItems: 'center',
              background: '#f2eaff',
              fontSize: '18px',
            }}>
              {item.icon}
            </div>

            <div>
              <strong style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>
                {item.title}
              </strong>
              <span style={{ color: '#6f687b', fontSize: '12px', lineHeight: 1.5 }}>
                {item.detail}
              </span>
            </div>

            <small style={{ color: '#968da3', whiteSpace: 'nowrap', fontSize: '11px' }}>
              {formatRelativeTime(item.timestamp)}
            </small>
          </div>
        ))
      )}
    </article>
  )
}

export default ExecutiveActivityFeed
