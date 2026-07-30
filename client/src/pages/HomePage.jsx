import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import logo from '../assets/logo.png'
import '../styles/homepage.css'
import banner from '../assets/banner.jpg'
import yoguImage from '../assets/yogu.jpg'
import aboutMlsnImage from '../assets/about-mlsn.png'
import testimonial1 from '../assets/testimonial-1.jpg'
import testimonial2 from '../assets/testimonial-2.jpg'
import testimonial3 from '../assets/testimonial-3.jpg'
import testimonial4 from '../assets/testimonial-4.jpg'
import testimonial5 from '../assets/testimonial-5.jpg'
import seminar1 from '../assets/seminar1.jpg'
import seminar2 from '../assets/seminar2.jpg'
import seminar3 from '../assets/seminar3.jpg'
import seminar4 from '../assets/seminar4.jpg'
import inasalImage from '../assets/inasal.jpg'
import crispyFriesImage from '../assets/crispy-fries.jpg'
import purpleBlendImage from '../assets/purple-blend.jpg'
import cfcImage from '../assets/cfc.png'
import NationwideSection from '../components/NationwideSection'

function HomePage({ onOpenLogin }) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [contactNumber, setContactNumber] = useState('')
  const [location, setLocation] = useState('')
  const [interestedConcept, setInterestedConcept] = useState('')
  const [budgetRange, setBudgetRange] = useState('')
  const [message, setMessage] = useState('')

  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [franchiseCount, setFranchiseCount] = useState(0)
  const [officeCount, setOfficeCount] = useState(0)
  const [yearCount, setYearCount] = useState(0)

  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeFaq, setActiveFaq] = useState(null)

  useEffect(() => {
    const fadeElements = Array.from(document.querySelectorAll('.fade-up'))
    const statsSection = document.querySelector('.stats-container')

    if (!('IntersectionObserver' in window)) {
      fadeElements.forEach((element) => element.classList.add('show'))
      setFranchiseCount(2000)
      setOfficeCount(3)
      setYearCount(2022)
      return undefined
    }

    fadeElements.forEach((element) => element.classList.remove('show'))

    const fadeObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return

          window.requestAnimationFrame(() => {
            entry.target.classList.add('show')
          })

          fadeObserver.unobserve(entry.target)
        })
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -8% 0px',
      }
    )

    fadeElements.forEach((element) => fadeObserver.observe(element))

    let counterFrame
    let counterStarted = false

    const startCounters = () => {
      if (counterStarted) return
      counterStarted = true

      const duration = 1600
      const startTime = performance.now()

      const animateCounters = (currentTime) => {
        const progress = Math.min((currentTime - startTime) / duration, 1)
        const easedProgress = 1 - Math.pow(1 - progress, 3)

        setFranchiseCount(Math.round(2000 * easedProgress))
        setOfficeCount(Math.round(3 * easedProgress))
        setYearCount(Math.round(2020 + 2 * easedProgress))

        if (progress < 1) {
          counterFrame = window.requestAnimationFrame(animateCounters)
        }
      }

      counterFrame = window.requestAnimationFrame(animateCounters)
    }

    const counterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          startCounters()
          counterObserver.unobserve(entry.target)
        })
      },
      {
        threshold: 0.35,
        rootMargin: '0px 0px -10% 0px',
      }
    )

    if (statsSection) {
      counterObserver.observe(statsSection)
    } else {
      setFranchiseCount(2000)
      setOfficeCount(3)
      setYearCount(2022)
    }

    const handleScroll = () => setScrolled(window.scrollY > 40)
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      fadeObserver.disconnect()
      counterObserver.disconnect()

      if (counterFrame) {
        window.cancelAnimationFrame(counterFrame)
      }

      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  function scrollToInquiry() {
    setMobileMenuOpen(false)
    document.getElementById('inquiry')?.scrollIntoView({ behavior: 'smooth' })
  }

  function scrollToSection(id) {
    setMobileMenuOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  function resetInquiryForm() {
    setFullName('')
    setEmail('')
    setContactNumber('')
    setLocation('')
    setInterestedConcept('')
    setBudgetRange('')
    setMessage('')
  }

  async function handleInquirySubmit(event) {
    event.preventDefault()

    setSuccessMessage('')
    setErrorMessage('')

    if (
      !fullName.trim() ||
      !contactNumber.trim() ||
      !location.trim() ||
      !interestedConcept
    ) {
      setErrorMessage(
        'Please complete your name, contact number, location, and interested concept.'
      )
      return
    }

    if (email.trim() && !email.trim().includes('@')) {
      setErrorMessage('Please enter a valid email address.')
      return
    }

    setIsSubmitting(true)

    try {
      const { error } = await supabase
        .from('franchise_inquiries')
        .insert([
          {
            full_name: fullName.trim(),
            email: email.trim().toLowerCase() || null,
            contact_number: contactNumber.trim(),
            location: location.trim(),
            interested_concept: interestedConcept,
            budget_range: budgetRange || null,
            message: message.trim() || null,
            status: 'New',
            assigned_to: null,
          },
        ])

      if (error) {
        console.error('Inquiry submission error:', error)
        setErrorMessage(error.message || 'Unable to submit your inquiry.')
        return
      }

      setSuccessMessage(
        'Thank you! Your franchise inquiry was submitted successfully. Our team will contact you soon.'
      )
      resetInquiryForm()
    } catch (error) {
      console.error('Unexpected inquiry error:', error)
      setErrorMessage(
        error instanceof Error ? error.message : 'Unable to submit your inquiry.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const concepts = [
    {
      image: inasalImage,
      name: 'Inasal Express',
      category: 'FOOD CONCEPT',
      description:
        'Filipino grilled chicken franchise designed for affordable, accessible operations.',
      startingFrom: '₱88,000',
      badge: 'Featured Concept',
      badgeTone: 'featured',
      format: 'Cart, kiosk, or compact store',
      highlights: ['Grilled chicken skewers & rice meals', 'Compact cart or kiosk format', 'High-traffic location ready'],
    },
    {
      image: purpleBlendImage,
      name: 'The Purple Blend',
      category: 'BEVERAGE CONCEPT',
      description:
        'Modern café franchise offering specialty coffee and refreshing beverages.',
      startingFrom: '₱120,000',
      badge: 'Beverage Concept',
      badgeTone: 'beverage',
      format: 'Café, kiosk, or cart',
      highlights: ['Specialty coffee & tea drinks', 'Taro, ube, and signature blends', 'Café or cart format'],
    },
    {
      image: yoguImage,
      name: 'Yogu Express',
      category: 'DESSERT CONCEPT',
      description:
        'Korean-inspired frozen yogurt franchise with customizable toppings and healthy options.',
      startingFrom: '₱150,000',
      badge: 'New Concept',
      badgeTone: 'new',
      format: 'Kiosk or full store',
      highlights: ['Self-serve frozen yogurt', 'Customizable toppings bar', 'Mall and high-foot-traffic ready'],
    },
    {
      image: cfcImage,
      name: 'CFC',
      category: 'FOOD CONCEPT',
      description:
        'Boneless fried chicken franchise featuring signature flavors paired with milkshakes.',
      startingFrom: '₱180,000',
      badge: 'Premium Format',
      badgeTone: 'premium',
      format: 'Kiosk or full store',
      highlights: ['Boneless fried chicken flavors', 'Signature milkshake varieties', 'Full store or kiosk format'],
    },
    {
      emoji: '🍗',
      name: 'Lechon ni Kuya Kurt',
      category: 'FOOD CONCEPT',
      description:
        'Filipino roasted chicken concept inspired by the country\'s well-loved lechon manok industry.',
      startingFrom: '₱95,000',
      badge: 'Neighbourhood Favourite',
      badgeTone: 'classic',
      format: 'Take-out or neighbourhood store',
      highlights: ['Roasted chicken (lechon manok)', 'Pinoy-style sides & combos', 'High-demand neighborhood format'],
    },
    {
      image: crispyFriesImage,
      name: 'Crispy Fries',
      category: 'SNACK CONCEPT',
      description:
        'Snack business concept offering affordable, high-demand potato products.',
      startingFrom: '₱75,000',
      badge: 'Compact Format',
      badgeTone: 'compact',
      format: 'Cart or kiosk',
      highlights: ['Flavored fries & snacks', 'Low-footprint cart format', 'Quick-service, high turnover'],
    },
  ]

  const whyCards = [
    {
      icon: '💸',
      title: 'Affordable Packages',
      points: [
        'Accessible investment options',
        'Multiple business concepts',
        'Designed for aspiring entrepreneurs',
      ],
    },
    {
      icon: '🎓',
      title: 'Business Training',
      points: [
        'Hands-on training',
        'Operations guidance',
        'Training manuals and support',
      ],
    },
    {
      icon: '📣',
      title: 'Marketing Support',
      points: [
        'Approved promotional materials',
        'Marketing guidance',
        'Online support assistance',
      ],
    },
    {
      icon: '📋',
      title: 'Business Registration Assistance',
      points: ['Permit guidance', 'Documentary assistance', 'Business setup support'],
    },
    {
      icon: '🌐',
      title: 'Nationwide Expansion Support',
      points: [
        'Continuous franchise assistance',
        'Business growth guidance',
        'Long-term partnership support',
      ],
    },
    {
      icon: '🤝',
      title: 'Dedicated Customer Service',
      points: ['Concern monitoring', 'Fast response support', 'Online customer portal'],
    },
  ]

  const processSteps = [
    { number: 1, title: 'Submit Inquiry', text: 'Send your preferred concept and location through our inquiry form.' },
    { number: 2, title: 'Business Orientation', text: 'Learn about MLSN and available franchise opportunities.' },
    { number: 3, title: 'Select Your Package', text: 'Choose the package that best fits your business goals.' },
    { number: 4, title: 'Training & Processing', text: 'Receive training and prepare your business requirements.' },
    { number: 5, title: 'Start Operating', text: 'Launch your franchise with continuous support from MLSN.' },
  ]

  const packages = [
    {
      badge: 'MOST AFFORDABLE',
      icon: '🚀',
      name: 'Starter Package',
      description:
        'Ideal for aspiring entrepreneurs looking for an affordable, business-ready franchise package.',
      features: [
        'Operate one store location',
        'Franchise equipment',
        'Initial products',
        'Marketing materials',
        'Free training',
        'Customer service support',
      ],
      featured: false,
    },
    {
      badge: 'MOST POPULAR',
      icon: '⭐',
      name: 'Preferred Package',
      description:
        'Perfect for entrepreneurs seeking expansion opportunities with additional business privileges.',
      features: [
        'Operate up to two stores',
        'Exclusive territory',
        'Franchise equipment and products',
        'Marketing materials',
        'Free training',
        'Customer service support',
      ],
      featured: true,
    },
    {
      badge: 'BEST VALUE',
      icon: '👑',
      name: 'Best Choice Package',
      description:
        'Our most comprehensive package designed for long-term growth and multi-store operations.',
      features: [
        'Operate up to three stores',
        'Exclusive territory',
        'Franchise equipment and products',
        'Marketing materials',
        'Free training',
        'Customer service support',
      ],
      featured: false,
    },
  ]

  const timeline = [
    { year: '2022', title: 'Company Established', text: 'MLSN Franchising Solution Corporation officially started its operations.' },
    { year: '2022', title: 'Iloilo Branch Expansion', text: 'Opened our Iloilo Branch to better support Visayas franchisees.' },
    { year: '2022', title: 'Bicol Branch Expansion', text: 'Expanded operations to Bicol Region for wider nationwide coverage.' },
    { year: '2022', title: '2,000+ Franchisees Nationwide', text: 'Continuously growing and supporting entrepreneurs across the Philippines.' },
  ]

  const faqs = [
    {
      q: 'How much is the franchise investment?',
      a: 'The investment depends on the selected franchise concept and package. Complete the inquiry form to receive the available package details from our team.',
    },
    {
      q: 'Does MLSN provide business training?',
      a: 'Yes. MLSN provides training and operational guidance to help franchisees understand the proper preparation, product handling, and daily operation of their selected concept.',
    },
    {
      q: 'Can I operate my franchise outside Luzon?',
      a: 'Yes. MLSN supports franchise opportunities in different locations nationwide, subject to concept availability and territory assessment.',
    },
    {
      q: 'What support will I receive after franchising?',
      a: 'Franchisees may receive training, marketing guidance, product assistance, customer service support, and access to the MLSN Franchisee Portal.',
    },
    {
      q: 'How long does the franchise process take?',
      a: 'Processing time may vary depending on the selected package, required documents, training schedule, production, and delivery location. Our team will provide the applicable timeline during the process.',
    },
    {
      q: 'How can I submit a franchise inquiry?',
      a: 'Complete the franchise inquiry form on this website. After submission, an MLSN representative will contact you regarding the available concepts, packages, and next steps.',
    },
  ]

  const navLinks = [
    { id: 'about', label: 'About' },
    { id: 'concepts', label: 'Concepts' },
    { id: 'packages', label: 'Packages' },
    { id: 'inquiry', label: 'Inquire' },
    { id: 'testimonials', label: 'Testimonials' },
    { id: 'contact', label: 'Contact' },
  ]

  return (
    <div className="homepage">
      {/* NAVBAR */}
      <nav className={`website-navbar ${scrolled ? 'navbar-scrolled' : ''}`}>
        <div className="navbar-inner">
          <a href="#top" className="navbar-brand" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
            <img src={logo} alt="MLSN" className="website-logo" />
            <div className="brand-text">
              <span className="brand-name">MLSN</span>
              <span className="brand-tagline">Franchising Solution Corporation</span>
            </div>
          </a>

          <div className={`navbar-links ${mobileMenuOpen ? 'open' : ''}`}>
            {navLinks.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                onClick={(e) => { e.preventDefault(); scrollToSection(link.id) }}
              >
                {link.label}
              </a>
            ))}
            <button type="button" className="login-button" onClick={onOpenLogin}>
              Franchisee Login
            </button>
          </div>

          <button
            type="button"
            className={`menu-toggle ${mobileMenuOpen ? 'open' : ''}`}
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section id="top" className="hero-section">
        <div className="hero-overlay" />
        <img src={banner} alt="MLSN Franchise Banner" className="hero-banner-image" />
        <div className="hero-content fade-up">
          <span className="hero-eyebrow">🇵🇭 Franchise Opportunities Nationwide</span>
          <h1>
            Build Your Business with <span className="hero-highlight">MLSN</span>
          </h1>
          <p className="hero-subtitle">
            From grilled chicken and specialty coffee to frozen yogurt and snack concepts —
            choose from six proven franchise brands and start your entrepreneurial journey
            with complete training, marketing, and operational support.
          </p>
          <div className="hero-cta-group">
            <button type="button" className="btn-primary" onClick={scrollToInquiry}>
              Inquire Now →
            </button>
            <a href="#concepts" className="btn-secondary" onClick={(e) => { e.preventDefault(); scrollToSection('concepts') }}>
              Explore Concepts
            </a>
          </div>
          <div className="hero-stats">
            <div><strong>2,000+</strong><span>Franchisees</span></div>
            <div><strong>6</strong><span>Concepts</span></div>
            <div><strong>3</strong><span>Offices</span></div>
          </div>
        </div>

        <div className="trust-badges fade-up">
        <div className="trust-badge"><span>🏛️</span> DTI Registered</div>
        <div className="trust-badge"><span>📋</span> BIR Accredited</div>
        <div className="trust-badge"><span>🏪</span> 2,000+ Franchisees</div>
        <div className="trust-badge"><span>📅</span> Established 2022</div>
        <div className="trust-badge"><span>🇵🇭</span> Nationwide Support</div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="website-section about-section fade-up">
        <div className="about-content">
          <span className="section-label">Our Story</span>
          <h2>About MLSN Franchising Solution Corporation</h2>
          <p>
            MLSN Franchising Solution Corporation empowers aspiring Filipino entrepreneurs
            by providing accessible, well-supported franchise opportunities across the
            country. With multiple proven food, beverage, and dessert concepts — and a
            growing network of corporate offices — we help partners launch, operate, and
            grow sustainable businesses.
          </p>
          <ul className="about-pillars">
            <li><strong>Nationwide growth</strong> across Luzon, Visayas, and Mindanao.</li>
            <li><strong>Multiple corporate offices</strong> to support regional franchisees.</li>
            <li><strong>End-to-end partnership</strong> from inquiry through operations.</li>
          </ul>
        </div>
        <div className="about-image-wrapper">
          <img src={aboutMlsnImage} alt="About MLSN" className="about-mlsn-image" />
        </div>
      </section>

      {/* WHY CHOOSE MLSN */}
      <section className="website-section why-section">
        <div className="section-header fade-up">
          <span className="section-label">Why Partner With Us</span>
          <h2>Why Choose MLSN?</h2>
          <p className="why-description">
            More than a franchise opportunity, MLSN provides complete business support to
            help aspiring entrepreneurs start, operate, and grow their businesses successfully.
          </p>
        </div>

        {/* Statistics */}
        <div className="stats-container">
          <div className="stat-card fade-up">
            <div className="stat-icon">🏪</div>
            <h3>{franchiseCount >= 2000 ? '2,000+' : franchiseCount.toLocaleString()}</h3>
            <span>Franchisees Nationwide</span>
          </div>
          <div className="stat-card fade-up animation-delay-1">
            <div className="stat-icon">🏢</div>
            <h3>{officeCount}</h3>
            <span>Corporate Offices</span>
          </div>
          <div className="stat-card fade-up animation-delay-2">
            <div className="stat-icon">📅</div>
            <h3>{yearCount}</h3>
            <span>Established</span>
          </div>
        </div>

        {/* Cards */}
        <div className="why-grid">
          {whyCards.map((card, i) => (
            <div
              key={card.title}
              className={`why-card fade-up animation-delay-${(i % 3) + 1}`}
            >
              <div className="why-card-icon">{card.icon}</div>
              <h3>{card.title}</h3>
              <ul>
                {card.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="why-cta fade-up">
          <span className="why-cta-label">Start Your Business Journey</span>
          <h3>Ready to Build Your Business with MLSN?</h3>
          <p>
            Join more than 2,000 franchisees nationwide and discover the franchise
            opportunity that matches your goals.
          </p>
          <button onClick={scrollToInquiry} className="why-cta-button">
            Inquire Now
          </button>
        </div>
      </section>

      {/* PROCESS */}
      <section className="website-section process-section">
        <div className="section-header fade-up">
          <span className="section-label">Simple Process</span>
          <h2>How To Start Your Franchise Journey</h2>
          <p className="process-description">
            Starting your business with MLSN is easy. Follow these simple steps and begin
            your entrepreneurial journey with confidence.
          </p>
        </div>

        <div className="process-grid">
          {processSteps.map((step) => (
            <div key={step.number} className="process-card fade-up">
              <div className="process-number">{step.number}</div>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* MLSN ACROSS THE PHILIPPINES */}
      <NationwideSection />

      {/* CONCEPTS */}
      <section id="concepts" className="website-section concepts-section">
        <div className="section-header fade-up">
          <span className="section-label">Our Franchise Concepts</span>
          <h2>Find the Perfect Franchise for You</h2>
          <p>
            Explore food, beverage, dessert, and snack concepts designed for
            different budgets, locations, and operating formats.
          </p>
        </div>

        <div className="concept-grid premium-concept-grid">
          {concepts.map((concept, index) => (
            <article
              key={concept.name}
              className={`concept-card premium-concept-card fade-up animation-delay-${
                (index % 3) + 1
              }`}
            >
              <div className="concept-image-area premium-concept-image-area">
                {concept.image ? (
                  <img
                    src={concept.image}
                    alt={concept.name}
                    className="concept-image"
                  />
                ) : (
                  <div className="concept-emoji">{concept.emoji}</div>
                )}

                <div className="concept-image-overlay" />

                <span
                  className={`concept-badge concept-badge-${concept.badgeTone}`}
                >
                  {concept.badge}
                </span>

                <div className="concept-image-title">
                  <span>{concept.category}</span>
                  <h3>{concept.name}</h3>
                </div>
              </div>

              <div className="concept-card-content premium-concept-content">
                <p className="concept-description">{concept.description}</p>

                <div className="concept-format">
                  <span>Recommended Format</span>
                  <strong>{concept.format}</strong>
                </div>

                <div className="concept-highlights">
                  {concept.highlights.map((highlight) => (
                    <span key={highlight} className="concept-highlight">
                      <span className="concept-check">✓</span>
                      {highlight}
                    </span>
                  ))}
                </div>

                <div className="concept-card-footer">
                  <div className="concept-price">
                    <span className="concept-price-label">Starting from</span>
                    <span className="concept-price-value">
                      {concept.startingFrom}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="concept-inquire-button"
                    onClick={() => {
                      setInterestedConcept(concept.name)
                      scrollToInquiry()
                    }}
                  >
                    View Franchise Details
                    <span aria-hidden="true">→</span>
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* FRANCHISE PACKAGES */}
      <section id="packages" className="website-section packages-section">
        <div className="section-header fade-up">
          <span className="section-label">Choose Your Package</span>
          <h2>Our Franchise Packages</h2>
          <p className="packages-introduction">
            Choose the franchise package that best suits your business goals and investment
            preferences.
          </p>
        </div>

        <div className="packages-grid">
          {packages.map((pkg) => (
            <div
              key={pkg.name}
              className={`package-card fade-up ${pkg.featured ? 'featured-package' : ''}`}
            >
              <div className="package-card-header">
                <span className={`package-badge ${pkg.featured ? 'featured-badge' : ''}`}>
                  {pkg.badge}
                </span>
                <div className="package-icon">{pkg.icon}</div>
                <h3>{pkg.name}</h3>
                <p className="package-description">{pkg.description}</p>
              </div>
              <ul className="package-list">
                {pkg.features.map((feature) => (
                  <li key={feature}>✓ {feature}</li>
                ))}
              </ul>
              <button type="button" className="package-button" onClick={scrollToInquiry}>
                Request Details
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* INQUIRY FORM */}
      <section id="inquiry" className="inquiry-section">
        <div className="inquiry-introduction fade-up">
          <span className="section-label">Start Your Business Journey</span>
          <h2>Become an MLSN Franchisee</h2>
          <p>
            Complete the form and our team will contact you regarding available franchise
            opportunities, packages, and the next steps.
          </p>

          <div className="inquiry-benefits">
            <div>
              <strong>✓</strong>
              <span>Learn about available concepts</span>
            </div>
            <div>
              <strong>✓</strong>
              <span>Receive package information</span>
            </div>
            <div>
              <strong>✓</strong>
              <span>Get assistance from our team</span>
            </div>
          </div>
        </div>

        <form className="franchise-inquiry-form fade-up" onSubmit={handleInquirySubmit}>
          <h3>Franchise Inquiry Form</h3>
          <p className="form-helper-text">Fields marked with * are required.</p>

          {successMessage && (
            <div className="success-message">{successMessage}</div>
          )}
          {errorMessage && (
            <div className="error-message">{errorMessage}</div>
          )}

          <div className="inquiry-form-grid">
            <div className="inquiry-field">
              <label htmlFor="inquiry-name">Full Name *</label>
              <input
                id="inquiry-name"
                type="text"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="inquiry-field">
              <label htmlFor="inquiry-email">Email Address</label>
              <input
                id="inquiry-email"
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="inquiry-field">
              <label htmlFor="inquiry-contact">Contact Number *</label>
              <input
                id="inquiry-contact"
                type="tel"
                placeholder="09XX XXX XXXX"
                value={contactNumber}
                onChange={(event) => setContactNumber(event.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="inquiry-field">
              <label htmlFor="inquiry-location">Preferred Location *</label>
              <input
                id="inquiry-location"
                type="text"
                placeholder="City or province"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="inquiry-field">
              <label htmlFor="inquiry-concept">Interested Concept *</label>
              <select
                id="inquiry-concept"
                value={interestedConcept}
                onChange={(event) => setInterestedConcept(event.target.value)}
                disabled={isSubmitting}
              >
                <option value="">Select a concept</option>
                <option value="Inasal Express">Inasal Express</option>
                <option value="The Purple Blend">The Purple Blend</option>
                <option value="Yogu Express">Yogu Express</option>
                <option value="CFC">CFC</option>
                <option value="Lechon ni Kuya Kurt">Lechon ni Kuya Kurt</option>
                <option value="Crispy Fries">Crispy Fries</option>
                <option value="Other Concepts">Other Concepts</option>
              </select>
            </div>

            <div className="inquiry-field">
              <label htmlFor="inquiry-budget">Estimated Budget</label>
              <select
                id="inquiry-budget"
                value={budgetRange}
                onChange={(event) => setBudgetRange(event.target.value)}
                disabled={isSubmitting}
              >
                <option value="">Select budget range</option>
                <option value="Below ₱50,000">Below ₱50,000</option>
                <option value="₱50,000–₱100,000">₱50,000–₱100,000</option>
                <option value="₱100,001–₱200,000">₱100,001–₱200,000</option>
                <option value="Above ₱200,000">Above ₱200,000</option>
              </select>
            </div>
          </div>

          <div className="inquiry-field">
            <label htmlFor="inquiry-message">Message</label>
            <textarea
              id="inquiry-message"
              placeholder="Tell us more about your preferred concept or location."
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              disabled={isSubmitting}
              rows="5"
            />
          </div>

          <button type="submit" className="inquiry-submit-button" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting Inquiry...' : 'Submit Franchise Inquiry'}
          </button>

          <small className="privacy-note">
            By submitting this form, you agree that MLSN may contact you regarding your
            franchise inquiry.
          </small>
        </form>
      </section>

      {/* COMPANY TIMELINE */}
      <section className="website-section timeline-section fade-up">
        <div className="section-header">
          <span className="section-label">Our Journey</span>
          <h2>MLSN Milestones</h2>
          <p className="timeline-description">
            From a single office in 2022 to serving thousands of franchisees nationwide.
          </p>
        </div>

        <div className="timeline">
          {timeline.map((item, i) => (
            <div key={i} className="timeline-item">
              <div className="timeline-year">
                <span className="timeline-icon">🏢</span>
                <span>{item.year}</span>
              </div>
              <div className="timeline-content">
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SEMINARS */}
      <section className="website-section seminar-section fade-up">
        <div className="section-header">
          <span className="section-label">Real Business Events</span>
          <h2>Seminars & Business Orientations</h2>
          <p className="seminar-description">
            MLSN continuously conducts business orientation seminars and franchise trainings
            nationwide to help aspiring entrepreneurs start their journey.
          </p>
        </div>

        <div className="seminar-gallery">
          <div className="seminar-card"><img src={seminar1} alt="MLSN Seminar" /></div>
          <div className="seminar-card"><img src={seminar2} alt="MLSN Seminar" /></div>
          <div className="seminar-card"><img src={seminar3} alt="MLSN Seminar" /></div>
          <div className="seminar-card"><img src={seminar4} alt="MLSN Seminar" /></div>
        </div>
      </section>

      {/* FRANCHISEE PORTAL */}
      <section className="portal-section upgraded-portal-section fade-up">
        <div className="portal-content">
          <span className="portal-label">Exclusive Franchisee Access</span>
          <h2>Already an MLSN Franchisee?</h2>
          <p className="portal-description">
            Access important announcements, submit concerns, monitor support tickets, and
            download approved marketing materials through the MLSN Franchisee Portal.
          </p>
          <div className="portal-features">
            <div className="portal-feature"><span>✓</span><p>Submit and track customer service concerns</p></div>
            <div className="portal-feature"><span>✓</span><p>Receive company announcements and updates</p></div>
            <div className="portal-feature"><span>✓</span><p>Access approved marketing materials</p></div>
            <div className="portal-feature"><span>✓</span><p>Monitor ticket progress and resolutions</p></div>
          </div>
          <button type="button" className="portal-login-button" onClick={onOpenLogin}>
            Open Franchisee Portal
          </button>
        </div>

        <div className="portal-preview">
          <div className="portal-preview-header">
            <div>
              <span className="preview-dot"></span>
              <span className="preview-dot"></span>
              <span className="preview-dot"></span>
            </div>
            <span>MLSN Portal</span>
          </div>
          <div className="portal-preview-body">
            <div className="preview-sidebar">
              <div className="preview-logo">MLSN</div>
              <div className="preview-menu active"></div>
              <div className="preview-menu"></div>
              <div className="preview-menu"></div>
              <div className="preview-menu"></div>
            </div>
            <div className="preview-dashboard">
              <h3>Franchisee Dashboard</h3>
              <div className="preview-stats">
                <div><strong>3</strong><span>Open Tickets</span></div>
                <div><strong>2</strong><span>Announcements</span></div>
                <div><strong>8</strong><span>Materials</span></div>
              </div>
              <div className="preview-ticket"></div>
              <div className="preview-ticket short"></div>
              <div className="preview-ticket"></div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="website-section faq-section fade-up">
        <div className="section-header">
          <span className="section-label">Helpful Information</span>
          <h2>Frequently Asked Questions</h2>
          <p className="faq-description">
            Find answers to some of the most common questions about starting a franchise
            with MLSN.
          </p>
        </div>

        <div className="faq-container">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className={`faq-item ${activeFaq === i ? 'open' : ''}`}
              onClick={() => setActiveFaq(activeFaq === i ? null : i)}
            >
              <div className="faq-question">
                <span>{faq.q}</span>
                <span className="faq-toggle">{activeFaq === i ? '−' : '+'}</span>
              </div>
              {activeFaq === i && <p className="faq-answer">{faq.a}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="testimonials" className="website-section testimonials-section fade-up">
        <div className="section-header">
          <span className="section-label">Franchisee Experiences</span>
          <h2>What Our Franchisees Say</h2>
          <p className="testimonials-description">
            See real feedback and experiences shared by our MLSN franchise partners.
          </p>
        </div>

        <div className="testimonials-gallery">
          <div className="testimonial-image-card"><img src={testimonial1} alt="Feedback from an MLSN franchisee" /></div>
          <div className="testimonial-image-card"><img src={testimonial2} alt="Feedback from an MLSN franchisee" /></div>
          <div className="testimonial-image-card"><img src={testimonial3} alt="Feedback from an MLSN franchisee" /></div>
          <div className="testimonial-image-card"><img src={testimonial4} alt="Feedback from an MLSN franchisee" /></div>
          <div className="testimonial-image-card"><img src={testimonial5} alt="Feedback from an MLSN franchisee" /></div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="final-cta-section fade-up">
        <div className="final-cta-content">
          <span className="final-cta-label">Start Your Business Today</span>
          <h2>Ready to Begin Your Franchise Journey?</h2>
          <p>
            Join more than 2,000 MLSN franchisees nationwide and take the next step toward
            building your own business.
          </p>
          <button type="button" className="final-cta-button" onClick={scrollToInquiry}>
            Inquire Now
          </button>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="website-section contact-section fade-up">
        <div className="section-header">
          <span className="section-label">Get In Touch</span>
          <h2>Visit Our Offices</h2>
          <p className="contact-description">
            Three corporate offices nationwide — find the branch nearest you. Our team is
            ready to assist with franchise inquiries and business opportunities.
          </p>
        </div>

        <div className="contact-grid">
          <div className="contact-card">
            <div className="contact-icon">🏢</div>
            <h3>Main Office — Pasay</h3>
            <p>Pasay City, Metro Manila</p>
            <span className="contact-sub">Headquarters</span>
          </div>
          <div className="contact-card">
            <div className="contact-icon">🏢</div>
            <h3>Iloilo Branch</h3>
            <p>Iloilo City, Western Visayas</p>
            <span className="contact-sub">Visayas coverage</span>
          </div>
          <div className="contact-card">
            <div className="contact-icon">🏢</div>
            <h3>Bicol Branch</h3>
            <p>Bicol Region, Luzon</p>
            <span className="contact-sub">Regional support</span>
          </div>
        </div>

        <div className="contact-meta">
          <div className="contact-meta-card"><span>📞</span><div><strong>Customer Service</strong><p>0916-306-7610</p></div></div>
          <div className="contact-meta-card"><span>🕒</span><div><strong>Office Hours</strong><p>Monday – Saturday, 8:00 AM – 5:00 PM</p></div></div>
          <div className="contact-meta-card"><span>💬</span><div><strong>WhatsApp / Messenger</strong><p>Chat with our team anytime</p></div></div>
        </div>

        <div className="contact-map">
          <iframe
            title="MLSN Office Locations"
            src="https://www.google.com/maps?q=Pasay+City+Metro+Manila&output=embed"
            width="100%"
            height="360"
            style={{ border: 0 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </section>

      {/* FLOATING CONTACT — WhatsApp + Inquiry */}
      <div className="floating-contact-group">
        <a
          href="https://wa.me/639163067610?text=Hi%20MLSN%2C%20I%27d%20like%20to%20ask%20about%20franchise%20opportunities."
          target="_blank"
          rel="noreferrer"
          className="floating-contact-buttons whatsapp-floating-button"
          aria-label="Chat on WhatsApp"
        >
          <span className="floating-icon">💬</span>
          <div className="floating-text">
            <span>Chat on WhatsApp</span>
            <small>Fastest response</small>
          </div>
        </a>
        <a
          href="https://m.me/mlsnfranchising"
          target="_blank"
          rel="noreferrer"
          className="floating-contact-buttons messenger-floating-button"
          aria-label="Chat on Messenger"
        >
          <span className="floating-icon">📨</span>
        </a>
      </div>

      {/* FOOTER */}
      <footer className="website-footer fade-up">
        <div className="footer-top">
          <div className="footer-brand">
            <img src={logo} alt="MLSN" className="footer-logo" />
            <div>
              <h3>MLSN Franchising Solution Corporation</h3>
              <p className="footer-description">
                Helping aspiring entrepreneurs build successful businesses nationwide.
              </p>
            </div>
          </div>
          <div className="footer-links">
            <a href="#about" onClick={(e) => { e.preventDefault(); scrollToSection('about') }}>About</a>
            <a href="#concepts" onClick={(e) => { e.preventDefault(); scrollToSection('concepts') }}>Concepts</a>
            <a href="#packages" onClick={(e) => { e.preventDefault(); scrollToSection('packages') }}>Packages</a>
            <a href="#testimonials" onClick={(e) => { e.preventDefault(); scrollToSection('testimonials') }}>Testimonials</a>
            <a href="#contact" onClick={(e) => { e.preventDefault(); scrollToSection('contact') }}>Contact</a>
          </div>
        </div>
        <small>
          © 2026 MLSN Franchising Solution Corporation · All Rights Reserved.
        </small>
      </footer>
    </div>
  )
}

export default HomePage