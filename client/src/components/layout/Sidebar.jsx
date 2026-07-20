import logo from '../../assets/logo.png'

function Sidebar({
  activePage,
  setActivePage,
  onLogout,
  unreadAnnouncements,
  setUnreadAnnouncements,
  unreadNotifications,
  onOpenNotifications,
}) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <img src={logo} alt="MLSN Logo" />
        <h2>MLSN Portal</h2>
        <p>Customer Service</p>
      </div>

      <button
        className={activePage === 'dashboard' ? 'active' : ''}
        onClick={() => setActivePage('dashboard')}
      >
        🏠 Dashboard
      </button>

      <button
        className={activePage === 'submit' ? 'active' : ''}
        onClick={() => setActivePage('submit')}
      >
        📝 Submit Concern
      </button>

      <button
        className={activePage === 'tickets' ? 'active' : ''}
        onClick={() => setActivePage('tickets')}
      >
        🎫 My Tickets
      </button>

      <button
        className={activePage === 'notifications' ? 'active' : ''}
        onClick={onOpenNotifications}
      >
        🔔 Notifications
        {unreadNotifications > 0 && (
          <span className="sidebar-badge">
            {unreadNotifications}
          </span>
        )}
      </button>

      <button
        className={activePage === 'announcements' ? 'active' : ''}
        onClick={() => {
          setActivePage('announcements')
          setUnreadAnnouncements(0)
        }}
      >
        📢 Announcements
        {unreadAnnouncements > 0 && (
          <span className="sidebar-badge">
            {unreadAnnouncements}
          </span>
        )}
      </button>

      <button
        className={activePage === 'marketing' ? 'active' : ''}
        onClick={() => setActivePage('marketing')}
      >
        📁 Marketing Library
      </button>

      <button
        className={activePage === 'profile' ? 'active' : ''}
        onClick={() => setActivePage('profile')}
      >
        👤 Profile
      </button>

      <button onClick={onLogout}>
        🚪 Logout
      </button>
    </aside>
  )
}

export default Sidebar