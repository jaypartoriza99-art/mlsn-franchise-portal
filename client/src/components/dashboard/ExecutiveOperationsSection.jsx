import ExecutiveActivityFeed from './ExecutiveActivityFeed'
import ExecutiveQuickInsights from './ExecutiveQuickInsights'

function ExecutiveOperationsSection({
  tickets = [],
  dashboardMetrics = {},
  ticketAnalytics = {},
  nearSlaCount = 0,
  overdueCount = 0,
}) {
  return (
    <section
      style={{
        display: 'grid',
        gridTemplateColumns:
          'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '14px',
        margin: '18px 0',
      }}
    >
      <ExecutiveActivityFeed
        tickets={tickets}
        recentFranchisees={
          dashboardMetrics.recentFranchisees || []
        }
      />

      <ExecutiveQuickInsights
        dashboardMetrics={dashboardMetrics}
        ticketAnalytics={ticketAnalytics}
        nearSlaCount={nearSlaCount}
        overdueCount={overdueCount}
      />
    </section>
  )
}

export default ExecutiveOperationsSection
