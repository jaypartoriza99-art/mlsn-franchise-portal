const STATUS_CARDS = [
  { key: 'submitted', icon: '🟡', label: 'Submitted' },
  { key: 'inProgress', icon: '🔵', label: 'In Progress' },
  { key: 'waiting', icon: '🟣', label: 'Waiting' },
  { key: 'resolved', icon: '🟢', label: 'Resolved' },
  { key: 'urgent', icon: '🚨', label: 'Urgent' },
  { key: 'nearSla', icon: '⏳', label: 'Near SLA' },
  { key: 'overdue', icon: '⚠️', label: 'Overdue' },
  { key: 'myTickets', icon: '👤', label: 'My Tickets' },
]

function TicketStatusCards({ counts, onSelect }) {
  return (
    <div className="stats modern-stats">
      {STATUS_CARDS.map((card) => (
        <button
          key={card.key}
          type="button"
          className="stat-card modern-card dashboard-stat-button"
          style={{ cursor: 'pointer', border: 'none', font: 'inherit' }}
          onClick={() => onSelect(card.key)}
        >
          <span className="stat-icon">{card.icon}</span>
          <h3>{card.label}</h3>
          <p>{counts[card.key] || 0}</p>
        </button>
      ))}
    </div>
  )
}

export default TicketStatusCards
