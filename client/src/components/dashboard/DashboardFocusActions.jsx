function DashboardFocusActions({
  overdueCount,
  nearSlaCount,
  submittedCount,
  canManageUsers,
  canManageAnnouncements,
  isSupervisor,
  onShowOverdue,
  onShowNearSla,
  onShowSubmitted,
  onOpenUserManagement,
  onOpenAnnouncements,
  onOpenInquiries,
  onOpenSurveyAnalytics,
}) {
  return (
    <section className="dashboard-focus-layout">
      <div className="dashboard-panel today-focus-panel">
        <div className="dashboard-panel-heading">
          <div>
            <span className="panel-eyebrow">Priority overview</span>
            <h2>Today&apos;s Focus</h2>
          </div>
        </div>

        <button type="button" onClick={onShowOverdue}>
          <span className="focus-dot focus-danger" />
          <strong>{overdueCount} overdue tickets</strong>
          <span>Review now →</span>
        </button>

        <button type="button" onClick={onShowNearSla}>
          <span className="focus-dot focus-warning" />
          <strong>{nearSlaCount} tickets near SLA</strong>
          <span>Monitor →</span>
        </button>

        <button type="button" onClick={onShowSubmitted}>
          <span className="focus-dot focus-info" />
          <strong>{submittedCount} newly submitted</strong>
          <span>Open queue →</span>
        </button>
      </div>

      <div className="dashboard-panel quick-actions-panel">
        <div className="dashboard-panel-heading">
          <div>
            <span className="panel-eyebrow">Shortcuts</span>
            <h2>Quick Actions</h2>
          </div>
        </div>

        <div className="quick-action-grid">
          {canManageUsers && (
            <button type="button" onClick={onOpenUserManagement}>
              <span>👥</span>
              <strong>User Management</strong>
            </button>
          )}

          {canManageAnnouncements && (
            <button type="button" onClick={onOpenAnnouncements}>
              <span>📢</span>
              <strong>Announcements</strong>
            </button>
          )}

          {canManageAnnouncements && (
            <button type="button" onClick={onOpenInquiries}>
              <span>📋</span>
              <strong>Franchise Inquiries</strong>
            </button>
          )}

          {isSupervisor && (
            <button type="button" onClick={onOpenSurveyAnalytics}>
              <span>⭐</span>
              <strong>Survey Analytics</strong>
            </button>
          )}
        </div>
      </div>
    </section>
  )
}

export default DashboardFocusActions
