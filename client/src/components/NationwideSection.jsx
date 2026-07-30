import seminar1 from '../assets/seminar1.jpg'
import seminar2 from '../assets/seminar2.jpg'
import seminar3 from '../assets/seminar3.jpg'
import seminar4 from '../assets/seminar4.jpg'

const seminarItems = [
  {
    image: seminar1,
    location: 'Luzon',
    title: 'Business Orientation Seminar',
    description:
      'Helping aspiring entrepreneurs understand available franchise concepts and business opportunities.',
  },
  {
    image: seminar2,
    location: 'Visayas',
    title: 'Franchise Consultation',
    description:
      'Providing guidance on franchise packages, business setup, and operational requirements.',
  },
  {
    image: seminar3,
    location: 'Mindanao',
    title: 'Food Tasting and Presentation',
    description:
      'Introducing MLSN products and concepts through interactive franchise events.',
  },
  {
    image: seminar4,
    location: 'Nationwide',
    title: 'Entrepreneurship Seminar',
    description:
      'Bringing franchise opportunities closer to Filipino entrepreneurs across the country.',
  },
]

function NationwideSection() {
  return (
    <section className="website-section nationwide-section">
      <div className="section-header fade-up">
        <span className="section-label">Nationwide Presence</span>
        <h2>MLSN Across the Philippines</h2>
        <p>
          Through franchise seminars, business orientations, consultations,
          and food-tasting events, MLSN continues to bring business
          opportunities closer to aspiring entrepreneurs nationwide.
        </p>
      </div>

      <div className="nationwide-highlight-grid">
        <article className="nationwide-feature-card fade-up">
          <img src={seminar1} alt="MLSN nationwide franchise seminar" />
          <div className="nationwide-feature-overlay" />
          <div className="nationwide-feature-content">
            <span>Nationwide Events</span>
            <h3>Building Opportunities Across Luzon, Visayas, and Mindanao</h3>
            <p>
              Every seminar represents another opportunity to connect with
              aspiring entrepreneurs and introduce sustainable franchise concepts.
            </p>
          </div>
        </article>

        <div className="nationwide-metrics fade-up animation-delay-1">
          <div><strong>3</strong><span>Major Regions</span></div>
          <div><strong>2,000+</strong><span>Franchisees</span></div>
          <div><strong>6</strong><span>Business Concepts</span></div>
        </div>
      </div>

      <div className="nationwide-gallery">
        {seminarItems.map((item, index) => (
          <article
            key={`${item.location}-${item.title}`}
            className={`nationwide-card fade-up animation-delay-${(index % 3) + 1}`}
          >
            <div className="nationwide-card-image">
              <img src={item.image} alt={`${item.title} in ${item.location}`} />
              <span className="nationwide-location">📍 {item.location}</span>
            </div>
            <div className="nationwide-card-content">
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
          </article>
        ))}
      </div>

      <div className="nationwide-footer fade-up">
        <div>
          <span className="nationwide-footer-label">Bringing Business Closer</span>
          <h3>MLSN continues to reach more cities and provinces nationwide.</h3>
        </div>
        <p>
          Final city and province labels can be updated once your complete
          seminar photo collection is ready.
        </p>
      </div>
    </section>
  )
}

export default NationwideSection