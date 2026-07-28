function AdminDashboardToolbar({
  unreadNotifications,
  canManageUsers,
  canManageAnnouncements,
  isSupervisor,
  onOpenNotifications,
  onOpenUserManagement,
  onOpenAnnouncements,
  onOpenInquiries,
  onOpenSurveyAnalytics,
  onLogout,
}) {
  return (
    <div className="admin-dashboard-actions">
      <div className="admin-action-group">
        <button
          type="button"
          className="notification-button"
          onClick={onOpenNotifications}
        >
          🔔 Notifications

          {unreadNotifications > 0 && (
            <span className="notification-count">
              {unreadNotifications}
            </span>
          )}
        </button>

        {canManageUsers && (
          <button
            type="button"
            className="user-management-button"
            onClick={onOpenUserManagement}
          >
            👥 User Management
          </button>
        )}

        {canManageAnnouncements && (
          <button
            type="button"
            className="user-management-button"
            onClick={onOpenAnnouncements}
          >
            📢 Announcements
          </button>
        )}

        {canManageAnnouncements && (
          <button
            type="button"
            className="user-management-button"
            onClick={onOpenInquiries}
          >
            📋 Franchise Inquiries
          </button>
        )}

        {isSupervisor && (
          <button
            type="button"
            className="user-management-button"
            onClick={onOpenSurveyAnalytics}
          >
            ⭐ Survey Analytics
          </button>
        )}
      </div>

      <button
        type="button"
        className="back-button"
        onClick={onLogout}
      >
        Logout
      </button>
    </div>
  )
}

export default AdminDashboardToolbar
