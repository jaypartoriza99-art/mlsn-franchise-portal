function getTopItem(items = []) {
  return items.length > 0 ? items[0] : null
}

function ExecutiveQuickInsights({
  dashboardMetrics = {},
  ticketAnalytics = {},
  nearSlaCount = 0,
  overdueCount = 0,
}) {
  const topPackage = getTopItem(
    dashboardMetrics.packageDistribution
  )

  const topRegion = getTopItem(
    dashboardMetrics.regionDistribution
  )

  const highestTicketVolume = getTopItem(
    ticketAnalytics.categoryDistribution
  )

  const openTickets =
    ticketAnalytics.openTickets || 0

  const totalTickets =
    ticketAnalytics.totalTickets || 0

  const resolvedTickets =
    Math.max(0, totalTickets - openTickets)

  const resolutionRate =
    totalTickets > 0
      ? Math.round(
          (resolvedTickets / totalTickets) * 100
        )
      : 0

  const insights = [
    {
      icon: '📦',
      label: 'Leading Package',
      value: topPackage
        ? topPackage.name
        : 'No package data',
      detail: topPackage
        ? `${topPackage.value} franchise records`
        : 'Add franchise package records',
    },
    {
      icon: '📍',
      label: 'Most Active Region',
      value: topRegion
        ? topRegion.name
        : 'No regional data',
      detail: topRegion
        ? `${topRegion.value} franchise records`
        : 'Add franchise region records',
    },
    {
      icon: '🔥',
      label: 'Highest Ticket Volume',
      value: highestTicketVolume
        ? highestTicketVolume.name
        : 'No CS concern data',
      detail: highestTicketVolume
        ? `${highestTicketVolume.value} tickets`
        : 'No matching CS tickets recorded',
    },
    {
      icon: '✅',
      label: 'Resolution Rate',
      value: `${resolutionRate}%`,
      detail:
        `${resolvedTickets} of ${totalTickets} tickets resolved`,
    },
    {
      icon: '⏱️',
      label: 'SLA Watch',
      value: `${nearSlaCount + overdueCount}`,
      detail:
        `${overdueCount} overdue · ${nearSlaCount} near SLA`,
    },
  ]

  return (
    <article
      style={{
        background: '#ffffff',
        border: '1px solid #e7e2f2',
        borderRadius: '16px',
        padding: '20px',
        boxShadow:
          '0 8px 24px rgba(52, 30, 86, 0.06)',
        minHeight: '360px',
      }}
    >
      <div style={{ marginBottom: '16px' }}>
        <span
          style={{
            color: '#7b3fc6',
            fontSize: '11px',
            fontWeight: 800,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          Management Summary
        </span>

        <h2
          style={{
            margin: '5px 0 4px',
            fontSize: '20px',
          }}
        >
          Quick Insights
        </h2>

        <p
          style={{
            margin: 0,
            color: '#756d84',
            fontSize: '13px',
          }}
        >
          Key patterns from current
          customer-service operations.
        </p>
      </div>

      <div style={{ display: 'grid', gap: '10px' }}>
        {insights.map((insight) => (
          <div
            key={insight.label}
            style={{
              display: 'grid',
              gridTemplateColumns:
                '42px minmax(0, 1fr)',
              gap: '12px',
              alignItems: 'center',
              padding: '12px',
              border: '1px solid #eee8f7',
              borderRadius: '13px',
              background: '#fcfaff',
            }}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                display: 'grid',
                placeItems: 'center',
                background: '#f0e5ff',
                fontSize: '18px',
              }}
            >
              {insight.icon}
            </div>

            <div style={{ minWidth: 0 }}>
              <span
                style={{
                  color: '#7d7488',
                  fontSize: '11px',
                  display: 'block',
                }}
              >
                {insight.label}
              </span>

              <strong
                style={{
                  display: 'block',
                  fontSize: '14px',
                  margin: '2px 0',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {insight.value}
              </strong>

              <small
                style={{
                  color: '#968da3',
                  fontSize: '11px',
                }}
              >
                {insight.detail}
              </small>
            </div>
          </div>
        ))}
      </div>
    </article>
  )
}

export default ExecutiveQuickInsights
