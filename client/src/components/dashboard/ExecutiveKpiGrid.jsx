function ExecutiveKpiGrid({
  dashboardMetrics,
  openTicketCount,
  overdueCount,
  nearSlaCount,
}) {
  return (
    <section className="executive-kpi-grid">
      <article className="executive-kpi-card">
        <div className="executive-kpi-icon">👥</div>
        <div>
          <span>Total Franchisees</span>
          <strong>{dashboardMetrics.franchisees}</strong>
          <small>
            +{dashboardMetrics.newFranchiseesThisMonth} added this month
          </small>
        </div>
      </article>

      <article className="executive-kpi-card">
        <div className="executive-kpi-icon">🎫</div>
        <div>
          <span>Open Tickets</span>
          <strong>{openTicketCount}</strong>
          <small>{overdueCount} currently overdue</small>
        </div>
      </article>

      <article className="executive-kpi-card">
        <div className="executive-kpi-icon">📦</div>
        <div>
          <span>Active Concepts</span>
          <strong>{dashboardMetrics.concepts}</strong>
          <small>
            Across {dashboardMetrics.packageTypes} package types
          </small>
        </div>
      </article>

      <article className="executive-kpi-card attention-card">
        <div className="executive-kpi-icon">⚠️</div>
        <div>
          <span>Needs Attention</span>
          <strong>{overdueCount + nearSlaCount}</strong>
          <small>
            {overdueCount} overdue · {nearSlaCount} near SLA
          </small>
        </div>
      </article>
    </section>
  )
}

export default ExecutiveKpiGrid
