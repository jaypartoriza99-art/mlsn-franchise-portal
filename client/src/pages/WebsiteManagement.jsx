    function WebsiteManagement({ onBack }) {
    const cards = [
        
        {
        title: 'Testimonials',
        icon: '⭐',
        description: 'Manage franchisee testimonials.',
        },
        {
        title: 'Hero Banner',
        icon: '🎬',
        description: 'Update homepage banners.',
        },
        {
        title: 'Franchise Concepts',
        icon: '🏪',
        description: 'Manage franchise concepts.',
        },
        {
        title: 'Statistics',
        icon: '📊',
        description: 'Update company statistics.',
        },
        {
        title: 'Website Settings',
        icon: '⚙️',
        description: 'Future website settings.',
        },
    ]

    return (
        <div
        style={{
            padding: '40px',
            maxWidth: '1200px',
            margin: '0 auto',
        }}
        >
        <button
            onClick={onBack}
            style={{
            marginBottom: '30px',
            padding: '10px 18px',
            cursor: 'pointer',
            }}
        >
            ← Back to Dashboard
        </button>

        <h1>🌐 Website & Marketing</h1>

        <p style={{ marginBottom: '30px' }}>
            Manage everything displayed on the official MLSN website.
        </p>

        <div
            style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px',
            }}
        >
            {cards.map((card) => (
            <div
                key={card.title}
                style={{
                border: '1px solid #ddd',
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center',
                background: '#fff',
                }}
            >
                <div
                style={{
                    fontSize: '40px',
                    marginBottom: '10px',
                }}
                >
                {card.icon}
                </div>

                <h3>{card.title}</h3>

    <p>{card.description}</p>

    <button
              className="website-manage-btn"
              onClick={
                card.title === 'Gallery'
                  ? onOpenGallery
                  : undefined
              }
              disabled={card.title !== 'Gallery'}
            >
              {card.title === 'Gallery'
                ? 'Manage →'
                : 'Coming Soon'}
            </button>

          </div>
        ))}
      </div>
    </div>
  )
}

export default WebsiteManagement