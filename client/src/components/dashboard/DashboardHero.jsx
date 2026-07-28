function DashboardHero({
  greeting,
  currentUserName,
  normalizedUserRole,
  dashboardDate,
}) {
  const fallbackName =
    normalizedUserRole === 'supervisor'
      ? 'Supervisor'
      : 'Customer Service'

  return (
    <section className="dashboard-hero">
      <div className="dashboard-hero-copy">
        <span className="dashboard-eyebrow">
          MLSN Operations Portal
        </span>

        <h1>
          {greeting}, {currentUserName || fallbackName} 👋
        </h1>

        <p>
          {normalizedUserRole === 'supervisor'
            ? 'Here is what needs your attention across customer service and franchise operations.'
            : 'Here is your customer service workload and ticket status for today.'}
        </p>
      </div>

      <div className="dashboard-date-card">
        <span>Today</span>
        <strong>{dashboardDate}</strong>
      </div>
    </section>
  )
}

export default DashboardHero
