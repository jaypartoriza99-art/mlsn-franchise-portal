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

function HomePage({ onOpenLogin }) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [contactNumber, setContactNumber] = useState('')
  const [location, setLocation] = useState('')
  const [interestedConcept, setInterestedConcept] =
    useState('')
  const [budgetRange, setBudgetRange] = useState('')
  const [message, setMessage] = useState('')

  const [successMessage, setSuccessMessage] =
    useState('')
  const [errorMessage, setErrorMessage] =
    useState('')
  const [isSubmitting, setIsSubmitting] =
  useState(false)
  const [franchiseCount, setFranchiseCount] =
  useState(0)

const [officeCount, setOfficeCount] =
  useState(0)

const [yearCount, setYearCount] =
  useState(0)

useEffect(() => {
  const fadeElements =
    document.querySelectorAll('.fade-up')

  const fadeObserver =
    new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
  entry.target.classList.add('show')
} else {
  entry.target.classList.remove('show')
}
        })
      },
      {
        threshold: 0.15,
      }
    )

  fadeElements.forEach((element) =>
    fadeObserver.observe(element)
  )

  const statsSection =
    document.querySelector('.stats-container')

  let counterStarted = false
  let counterTimer

  const counterObserver =
  new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          let currentStep = 0

          const duration = 1500
          const interval = 20
          const steps =
            duration / interval

          const counterTimer =
            setInterval(() => {
              currentStep += 1

              const progress =
                currentStep / steps

              setFranchiseCount(
                Math.min(
                  Math.floor(
                    2000 * progress
                  ),
                  2000
                )
              )

              setOfficeCount(
                Math.min(
                  Math.floor(
                    3 * progress
                  ),
                  3
                )
              )

              setYearCount(
                Math.min(
                  Math.floor(
                    2020 +
                      2 * progress
                  ),
                  2022
                )
              )

              if (
                currentStep >= steps
              ) {
                clearInterval(
                  counterTimer
                )
              }
            }, interval)
        } else {
          setFranchiseCount(0)
          setOfficeCount(0)
          setYearCount(2020)
        }
      })
    },
    {
      threshold: 0.4,
    }
  )

  if (statsSection) {
    counterObserver.observe(statsSection)
  }

  return () => {
    fadeObserver.disconnect()
    counterObserver.disconnect()

    if (counterTimer) {
      clearInterval(counterTimer)
    }
  }
}, [])

function scrollToInquiry() {
    document
      .getElementById('inquiry')
      ?.scrollIntoView({
        behavior: 'smooth',
      })
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

    if (
      email.trim() &&
      !email.trim().includes('@')
    ) {
      setErrorMessage(
        'Please enter a valid email address.'
      )
      return
    }

    setIsSubmitting(true)

    try {
      const { error } = await supabase
        .from('franchise_inquiries')
        .insert([
          {
            full_name: fullName.trim(),
            email:
              email.trim().toLowerCase() ||
              null,
            contact_number:
              contactNumber.trim(),
            location: location.trim(),
            interested_concept:
              interestedConcept,
            budget_range:
              budgetRange || null,
            message:
              message.trim() || null,
            status: 'New',
            assigned_to: null,
          },
        ])

      if (error) {
        console.error(
          'Inquiry submission error:',
          error
        )

        setErrorMessage(
          error.message ||
            'Unable to submit your inquiry.'
        )
        return
      }

      setSuccessMessage(
        'Thank you! Your franchise inquiry was submitted successfully. Our team will contact you soon.'
      )

      resetInquiryForm()
    } catch (error) {
      console.error(
        'Unexpected inquiry error:',
        error
      )

      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to submit your inquiry.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="homepage">
      {/* NAVBAR */}
      <nav className="website-navbar">
        <div className="navbar-left">
          <img
            src={logo}
            alt="MLSN"
            className="website-logo"
          />

          <h2>
            MLSN Franchising Solution
            Corporation
          </h2>
        </div>

        <div className="navbar-right">
          <a href="#about">About</a>
          <a href="#concepts">Concepts</a>
          <a href="#packages">Packages</a>
          <a href="#inquiry">Inquire</a>
          <a href="#contact">Contact</a>

          <button
            type="button"
            className="login-button"
            onClick={onOpenLogin}
          >
            Franchisee Login
          </button>
        </div>
      </nav>

    
      {/* HERO */}
<section className="hero-section">
  <img
    src={banner}
    alt="MLSN Franchise Banner"
    className="hero-banner-image"
  />
</section>

      {/* ABOUT */}
      <section
  id="about"
  className="website-section about-section fade-up"
>
  <h2>About MLSN Franchising Solution Corporation</h2>

  <p>
    Learn more about MLSN Franchising
    Solution Corporation, our nationwide
    growth, offices, and commitment to
    empowering aspiring entrepreneurs.
  </p>

  <div className="about-image-wrapper">
    <img
      src={aboutMlsnImage}
      alt="About MLSN"
      className="about-mlsn-image"
    />
  </div>
</section>

      {/* WHY CHOOSE MLSN */}
      <section
  className="website-section why-section fade-up"
>
  <h2>Why Choose MLSN?</h2>

  <p className="why-description">
    More than a franchise opportunity, MLSN provides
    complete business support to help aspiring
    entrepreneurs start, operate, and grow their
    businesses successfully.
  </p>

  {/* Statistics */}
  <div className="stats-container">
  <div className="stat-card fade-up">
    <h3>
      {franchiseCount >= 2000
        ? '2K+'
        : franchiseCount}
    </h3>

    <span>Franchisees Nationwide</span>
  </div>

  <div className="stat-card fade-up animation-delay-1">
    <h3>{officeCount}</h3>

    <span>Corporate Offices</span>
  </div>

  <div className="stat-card fade-up animation-delay-2">
    <h3>{yearCount}</h3>

    <span>Established</span>
  </div>
</div>

  {/* Cards */}
  <div className="why-grid">

    <div className="why-card fade-up">
      <h3>Affordable Packages</h3>

      <ul>
        <li>Accessible investment options</li>
        <li>Multiple business concepts</li>
        <li>Designed for aspiring entrepreneurs</li>
      </ul>
    </div>

    <div className="why-card fade-up animation-delay-1">
      <h3>Business Training</h3>

      <ul>
        <li>Hands-on training</li>
        <li>Operations guidance</li>
        <li>Training manuals and support</li>
      </ul>
    </div>

    <div className="why-card fade-up animation-delay-2">
      <h3>Marketing Support</h3>

      <ul>
        <li>Approved promotional materials</li>
        <li>Marketing guidance</li>
        <li>Online support assistance</li>
      </ul>
    </div>

    <div className="why-card fade-up animation-delay-3">
      <h3>Business Registration Assistance</h3>

      <ul>
        <li>Permit guidance</li>
        <li>Documentary assistance</li>
        <li>Business setup support</li>
      </ul>
    </div>

    <div className="why-card fade-up animation-delay-1">
      <h3>Nationwide Expansion Support</h3>

      <ul>
        <li>Continuous franchise assistance</li>
        <li>Business growth guidance</li>
        <li>Long-term partnership support</li>
      </ul>
    </div>

    <div className="why-card fade-up animation-delay-2">
      <h3>Dedicated Customer Service</h3>

      <ul>
        <li>Concern monitoring</li>
        <li>Fast response support</li>
        <li>Online customer portal</li>
      </ul>
    </div>

  </div>

  <div className="why-cta">
  <span className="why-cta-label">
    Start Your Business Journey
  </span>

  <h3>
    Ready to Build Your Business with MLSN?
  </h3>

  <p>
    Join more than 2,000 franchisees nationwide and
    discover the franchise opportunity that matches
    your goals.
  </p>

  <button
    onClick={scrollToInquiry}
    className="why-cta-button"
  >
    Inquire Now
  </button>
</div>

</section>

<section className="website-section process-section">

  <span className="section-label">
    Simple Process
  </span>

  <h2>
    How To Start Your Franchise Journey
  </h2>

  <p className="process-description">
    Starting your business with MLSN is easy.
    Follow these simple steps and begin your
    entrepreneurial journey with confidence.
  </p>

  <div className="process-grid">

    <div className="process-card">
      <div className="process-number">
        1
      </div>

      <h3>Submit Inquiry</h3>

      <p>
        Send us your preferred concept and
        location through our inquiry form.
      </p>
    </div>

    <div className="process-card">
      <div className="process-number">
        2
      </div>

      <h3>Business Orientation</h3>

      <p>
        Learn more about MLSN and available
        franchise opportunities.
      </p>
    </div>

    <div className="process-card">
      <div className="process-number">
        3
      </div>

      <h3>Select Your Package</h3>

      <p>
        Choose the package that best fits
        your business goals.
      </p>
    </div>

    <div className="process-card">
      <div className="process-number">
        4
      </div>

      <h3>Training & Processing</h3>

      <p>
        Receive training and prepare your
        business requirements.
      </p>
    </div>

    <div className="process-card">
      <div className="process-number">
        5
      </div>

      <h3>Start Operating</h3>

      <p>
        Launch your franchise with
        continuous support from MLSN.
      </p>
    </div>

  </div>

</section>

      {/* CONCEPTS */}
<section
  id="concepts"
  className="website-section"
>
  <h2>Find the Perfect Franchise For You</h2>

  <p>
    From grilled chicken and coffee to frozen yogurt
    and flavored chicken concepts, discover the
    business opportunity that matches your goals.
  </p>

  <div className="concept-grid">

    {/* INASAL */}
    <div className="concept-card upgraded-concept-card">
      <div className="concept-image-area">
        <div className="concept-emoji">🍗</div>
      </div>

      <div className="concept-card-content">
        <span className="concept-category">
          FOOD CONCEPT
        </span>

        <h3>Inasal Express</h3>

        <p>
          Filipino grilled chicken franchise
          concept designed for affordable and
          accessible business operations.
        </p>

        <button
          type="button"
          className="concept-inquire-button"
          onClick={() => {
            setInterestedConcept('Inasal Express')
            scrollToInquiry()
          }}
        >
          View Franchise Details
        </button>
      </div>
    </div>

    {/* PURPLE BLEND */}
    <div className="concept-card upgraded-concept-card">
      <div className="concept-image-area">
        <div className="concept-emoji">☕</div>
      </div>

      <div className="concept-card-content">
        <span className="concept-category">
          BEVERAGE CONCEPT
        </span>

        <h3>The Purple Blend</h3>

        <p>
          Coffee and beverage franchise concept
          offering modern café products and
          refreshing drinks.
        </p>

        <button
          type="button"
          className="concept-inquire-button"
          onClick={() => {
            setInterestedConcept('The Purple Blend')
            scrollToInquiry()
          }}
        >
          View Franchise Details
        </button>
      </div>
    </div>

    {/* YOGU */}
    <div className="concept-card upgraded-concept-card">
      <div className="concept-image-area">
        <img
          src={yoguImage}
          alt="Yogu Express"
          className="concept-image"
        />
      </div>

      <div className="concept-card-content">
        <span className="concept-category">
          DESSERT CONCEPT
        </span>

        <h3>Yogu Express</h3>

        <p>
          Korean-inspired frozen yogurt franchise
          featuring customizable toppings and
          healthy dessert options.
        </p>

        <button
          type="button"
          className="concept-inquire-button"
          onClick={() => {
            setInterestedConcept('Yogu Express')
            scrollToInquiry()
          }}
        >
          View Franchise Details
        </button>
      </div>
    </div>

    {/* CFC */}
    <div className="concept-card upgraded-concept-card">
      <div className="concept-image-area">
        <div className="concept-emoji">🍗</div>
      </div>

      <div className="concept-card-content">
        <span className="concept-category">
          FOOD CONCEPT
        </span>

        <h3>CFC</h3>

        <p>
          Boneless fried chicken franchise
          featuring different flavors paired
          with signature milkshake varieties.
        </p>

        <button
          type="button"
          className="concept-inquire-button"
          onClick={() => {
            setInterestedConcept('CFC')
            scrollToInquiry()
          }}
        >
          View Franchise Details
        </button>
      </div>
    </div>

    {/* CRISPY FRIES */}
    <div className="concept-card upgraded-concept-card">
      <div className="concept-image-area">
        <div className="concept-emoji">🍟</div>
      </div>

      <div className="concept-card-content">
        <span className="concept-category">
          SNACK CONCEPT
        </span>

        <h3>Crispy Fries</h3>

        <p>
          Snack business concept offering
          affordable and high-demand potato
          products.
        </p>

        <button
          type="button"
          className="concept-inquire-button"
          onClick={() => {
            setInterestedConcept('Crispy Fries')
            scrollToInquiry()
          }}
        >
          View Franchise Details
        </button>
      </div>
    </div>

  </div>
</section>
{/* FRANCHISE PACKAGES */}
<section
  id="packages"
  className="website-section packages-section"
>
  <span className="section-label">
    Choose Your Package
  </span>

  <h2>Our Franchise Packages</h2>

  <p className="packages-introduction">
    Choose the franchise package that best suits
    your business goals and investment preferences.
  </p>

  <div className="packages-grid">
    <div className="package-card">
  <div className="package-card-header">

    <span className="package-badge">
      MOST AFFORDABLE
    </span>

    <div className="package-icon">
      🚀
    </div>

    <h3>Starter Package</h3>

    <p className="package-description">
      Ideal for aspiring entrepreneurs
      looking for an affordable and
      business-ready franchise package.
    </p>

  </div>

  <ul className="package-list">
    <li>✓ Operate one store location</li>
    <li>✓ Franchise equipment</li>
    <li>✓ Initial products</li>
    <li>✓ Marketing materials</li>
    <li>✓ Free training</li>
    <li>✓ Customer service support</li>
  </ul>

  <button
    type="button"
    className="package-button"
    onClick={scrollToInquiry}
  >
    Request Details
  </button>
</div>

    <div className="package-card featured-package">
  <div className="package-card-header">

    <span className="package-badge featured-badge">
      MOST POPULAR
    </span>

    <div className="package-icon">
      ⭐
    </div>

    <h3>Preferred Package</h3>

    <p className="package-description">
      Perfect for entrepreneurs seeking
      expansion opportunities with
      additional business privileges.
    </p>

  </div>

  <ul className="package-list">
    <li>✓ Operate up to two stores</li>
    <li>✓ Exclusive territory</li>
    <li>✓ Franchise equipment and products</li>
    <li>✓ Marketing materials</li>
    <li>✓ Free training</li>
    <li>✓ Customer service support</li>
  </ul>

  <button
    type="button"
    className="package-button"
    onClick={scrollToInquiry}
  >
    Request Details
  </button>
</div>

    <div className="package-card">
  <div className="package-card-header">

    <span className="package-badge featured-badge">
      BEST VALUE
    </span>

    <div className="package-icon">
  👑
</div>

    <h3>Best Choice Package</h3>

    <p className="package-description">
      Our most comprehensive package
designed for long-term growth and
multi-store operations.

    </p>

  </div>

  <ul className="package-list">
    <li>✓ Operate up to three stores</li>
    <li>✓ Exclusive territory</li>
    <li>✓ Franchise equipment and products</li>
    <li>✓ Marketing materials</li>
    <li>✓ Free training</li>
    <li>✓ Customer service support</li>
  </ul>

  <button
    type="button"
    className="package-button"
    onClick={scrollToInquiry}
  >
    Request Details
  </button>
</div>
  
  </div>
</section>

      {/* STATISTICS */}
      <section className="stats-section">
        <div className="stat-card">
          <h2>Multiple</h2>
          <p>Franchise Concepts</p>
        </div>

        <div className="stat-card">
          <h2>Nationwide</h2>
          <p>Franchisee Support</p>
        </div>

        <div className="stat-card">
          <h2>Dedicated</h2>
          <p>Customer Service</p>
        </div>
      </section>

      {/* PUBLIC INQUIRY FORM */}
      <section
        id="inquiry"
        className="inquiry-section"
      >
        <div className="inquiry-introduction">
          <span className="section-label">
            Start Your Business Journey
          </span>

          <h2>Become an MLSN Franchisee</h2>

          <p>
            Complete the form and our team will
            contact you regarding available
            franchise opportunities, packages,
            and the next steps.
          </p>

          <div className="inquiry-benefits">
            <div>
              <strong>✓</strong>
              <span>
                Learn about available concepts
              </span>
            </div>

            <div>
              <strong>✓</strong>
              <span>
                Receive package information
              </span>
            </div>

            <div>
              <strong>✓</strong>
              <span>
                Get assistance from our team
              </span>
            </div>
          </div>
        </div>

        <form
          className="franchise-inquiry-form"
          onSubmit={handleInquirySubmit}
        >
          <h3>Franchise Inquiry Form</h3>

          <p className="form-helper-text">
            Fields marked with * are required.
          </p>

          {successMessage && (
            <div className="success-message">
              {successMessage}
            </div>
          )}

          {errorMessage && (
            <div className="error-message">
              {errorMessage}
            </div>
          )}

          <div className="inquiry-form-grid">
            <div className="inquiry-field">
              <label htmlFor="inquiry-name">
                Full Name *
              </label>

              <input
                id="inquiry-name"
                type="text"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(event) =>
                  setFullName(
                    event.target.value
                  )
                }
                disabled={isSubmitting}
              />
            </div>

            <div className="inquiry-field">
              <label htmlFor="inquiry-email">
                Email Address
              </label>

              <input
                id="inquiry-email"
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                disabled={isSubmitting}
              />
            </div>

            <div className="inquiry-field">
              <label htmlFor="inquiry-contact">
                Contact Number *
              </label>

              <input
                id="inquiry-contact"
                type="tel"
                placeholder="09XX XXX XXXX"
                value={contactNumber}
                onChange={(event) =>
                  setContactNumber(
                    event.target.value
                  )
                }
                disabled={isSubmitting}
              />
            </div>

            <div className="inquiry-field">
              <label htmlFor="inquiry-location">
                Preferred Location *
              </label>

              <input
                id="inquiry-location"
                type="text"
                placeholder="City or province"
                value={location}
                onChange={(event) =>
                  setLocation(
                    event.target.value
                  )
                }
                disabled={isSubmitting}
              />
            </div>

            <div className="inquiry-field">
              <label htmlFor="inquiry-concept">
                Interested Concept *
              </label>

              <select
                id="inquiry-concept"
                value={interestedConcept}
                onChange={(event) =>
                  setInterestedConcept(
                    event.target.value
                  )
                }
                disabled={isSubmitting}
              >
                <option value="">
                  Select a concept
                </option>

                <option value="Inasal Express">
                  Inasal Express
                </option>

                <option value="The Purple Blend">
                  The Purple Blend
                </option>

                <option value="Yogu Express">
  Yogu Express
</option>

<option value="CFC">
  CFC
</option>

                <option value="Crispy Fries">
                  Crispy Fries
                </option>

                <option value="Other Concepts">
                  Other Concepts
                </option>
              </select>
            </div>

            <div className="inquiry-field">
              <label htmlFor="inquiry-budget">
                Estimated Budget
              </label>

              <select
                id="inquiry-budget"
                value={budgetRange}
                onChange={(event) =>
                  setBudgetRange(
                    event.target.value
                  )
                }
                disabled={isSubmitting}
              >
                <option value="">
                  Select budget range
                </option>

                <option value="Below ₱50,000">
                  Below ₱50,000
                </option>

                <option value="₱50,000–₱100,000">
                  ₱50,000–₱100,000
                </option>

                <option value="₱100,001–₱200,000">
                  ₱100,001–₱200,000
                </option>

                <option value="Above ₱200,000">
                  Above ₱200,000
                </option>
              </select>
            </div>
          </div>

          <div className="inquiry-field">
            <label htmlFor="inquiry-message">
              Message
            </label>

            <textarea
              id="inquiry-message"
              placeholder="Tell us more about your preferred concept or location."
              value={message}
              onChange={(event) =>
                setMessage(event.target.value)
              }
              disabled={isSubmitting}
              rows="5"
            />
          </div>

          <button
            type="submit"
            className="inquiry-submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? 'Submitting Inquiry...'
              : 'Submit Franchise Inquiry'}
          </button>

          <small className="privacy-note">
            By submitting this form, you agree
            that MLSN may contact you regarding
            your franchise inquiry.
          </small>
        </form>
      </section>

      {/* FRANCHISEE PORTAL */}
      <section className="portal-section upgraded-portal-section">
  <div className="portal-content">
    <span className="portal-label">
      Exclusive Franchisee Access
    </span>

    <h2>Already an MLSN Franchisee?</h2>

    <p className="portal-description">
      Access important announcements, submit concerns,
      monitor support tickets, and download approved
      marketing materials through the MLSN Franchisee Portal.
    </p>

    <div className="portal-features">
      <div className="portal-feature">
        <span>✓</span>
        <p>Submit and track customer service concerns</p>
      </div>

      <div className="portal-feature">
        <span>✓</span>
        <p>Receive company announcements and updates</p>
      </div>

      <div className="portal-feature">
        <span>✓</span>
        <p>Access approved marketing materials</p>
      </div>

      <div className="portal-feature">
        <span>✓</span>
        <p>Monitor ticket progress and resolutions</p>
      </div>
    </div>

    <button
      type="button"
      className="portal-login-button"
      onClick={onOpenLogin}
    >
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
          <div>
            <strong>3</strong>
            <span>Open Tickets</span>
          </div>

          <div>
            <strong>2</strong>
            <span>Announcements</span>
          </div>

          <div>
            <strong>8</strong>
            <span>Materials</span>
          </div>
        </div>

        <div className="preview-ticket"></div>
        <div className="preview-ticket short"></div>
        <div className="preview-ticket"></div>
      </div>
    </div>
  </div>
</section>

      {/* FREQUENTLY ASKED QUESTIONS */}
<section className="website-section faq-section fade-up">
  <span className="section-label">
    Helpful Information
  </span>

  <h2>Frequently Asked Questions</h2>

  <p className="faq-description">
    Find answers to some of the most common
    questions about starting a franchise with MLSN.
  </p>

  <div className="faq-container">

    <details className="faq-item">
      <summary>
        How much is the franchise investment?
      </summary>

      <p>
        The investment depends on the selected
        franchise concept and package. Complete
        the inquiry form to receive the available
        package details from our team.
      </p>
    </details>

    <details className="faq-item">
      <summary>
        Does MLSN provide business training?
      </summary>

      <p>
        Yes. MLSN provides training and operational
        guidance to help franchisees understand the
        proper preparation, product handling, and
        daily operation of their selected concept.
      </p>
    </details>

    <details className="faq-item">
      <summary>
        Can I operate my franchise outside Luzon?
      </summary>

      <p>
        Yes. MLSN supports franchise opportunities
        in different locations nationwide, subject
        to concept availability and territory
        assessment.
      </p>
    </details>

    <details className="faq-item">
      <summary>
        What support will I receive after franchising?
      </summary>

      <p>
        Franchisees may receive training, marketing
        guidance, product assistance, customer
        service support, and access to the MLSN
        Franchisee Portal.
      </p>
    </details>

    <details className="faq-item">
      <summary>
        How long does the franchise process take?
      </summary>

      <p>
        Processing time may vary depending on the
        selected package, required documents,
        training schedule, production, and delivery
        location. Our team will provide the applicable
        timeline during the process.
      </p>
    </details>

    <details className="faq-item">
      <summary>
        How can I submit a franchise inquiry?
      </summary>

      <p>
        Complete the franchise inquiry form on this
        website. After submission, an MLSN
        representative will contact you regarding
        the available concepts, packages, and next
        steps.
      </p>
    </details>

  </div>
</section>

{/* TESTIMONIALS */}
<section
  id="testimonials"
  className="website-section testimonials-section fade-up"
>
  <span className="section-label">
    Franchisee Experiences
  </span>

  <h2>What Our Franchisees Say</h2>

  <p className="testimonials-description">
    See real feedback and experiences shared by our
    MLSN franchise partners.
  </p>

  <div className="testimonials-gallery">
    <div className="testimonial-image-card">
      <img
        src={testimonial1}
        alt="Feedback from an MLSN franchisee"
      />
    </div>

    <div className="testimonial-image-card">
      <img
        src={testimonial2}
        alt="Feedback from an MLSN franchisee"
      />
    </div>

    <div className="testimonial-image-card">
      <img
        src={testimonial3}
        alt="Feedback from an MLSN franchisee"
      />
    </div>

    <div className="testimonial-image-card">
      <img
        src={testimonial4}
        alt="Feedback from an MLSN franchisee"
      />
    </div>

    <div className="testimonial-image-card">
      <img
        src={testimonial5}
        alt="Feedback from an MLSN franchisee"
      />
    </div>
  </div>
</section>

      {/* CONTACT */}
      <section className="contact-section fade-up">

  <span className="section-label">
    Get In Touch
  </span>

  <h2>Contact Us</h2>

  <p className="contact-description">
    Our team is ready to assist you with your
    franchise inquiries and business opportunities.
  </p>

  <div className="contact-grid">

    <div className="contact-card">
      <div className="contact-icon">
        📍
      </div>

      <h3>Main Office</h3>

      <p>
        Pasay City,
        Philippines
      </p>
    </div>

    <div className="contact-card">
      <div className="contact-icon">
        📞
      </div>

      <h3>Customer Service</h3>

      <p>
        0916-306-7610
      </p>
    </div>

    <div className="contact-card">
      <div className="contact-icon">
        🕒
      </div>

      <h3>Office Hours</h3>

      <p>
        Monday - Saturday
        <br />
        8:00 AM - 5:00 PM
      </p>
    </div>

  </div>

</section>

{/* FLOATING CONTACT BUTTONS */}

<div className="floating-contact-buttons">
  <a
  href="#inquiry"
  className="floating-contact-button messenger-floating-button"
>
  <div className="floating-text">
    <span>🚀 Start Franchising</span>
    <small>Our Team Will Assist You</small>
  </div>
</a>

</div>

      {/* FOOTER */}
      <footer className="website-footer fade-up">

  <h3>
    MLSN Franchising Solution Corporation
  </h3>

  <p className="footer-description">
    Helping aspiring entrepreneurs build successful businesses nationwide.
  </p>

  <div className="footer-links">
    <a href="#about">About</a>
    <a href="#concepts">Concepts</a>
    <a href="#packages">Packages</a>
    <a href="#contact">Contact</a>
      <a href="#testimonials">Testimonials</a>
  </div>

  <small>
    © 2026 MLSN Franchising Solution Corporation
    <br />
    All Rights Reserved.
  </small>

</footer>
    </div>
  )
}

export default HomePage