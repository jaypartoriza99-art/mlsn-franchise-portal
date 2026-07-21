import { useState } from 'react'
import { supabase } from '../lib/supabase'
import logo from '../assets/logo.png'
import '../styles/homepage.css'
import banner from '../assets/banner.jpg'
import yoguImage from '../assets/yogu.jpg'
import aboutMlsnImage from '../assets/about-mlsn.png'


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
  className="website-section about-section"
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
  className="website-section why-section"
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
    <div className="stat-card">
      <h3>2K+</h3>
      <span>Franchisees Nationwide</span>
    </div>

    <div className="stat-card">
      <h3>3</h3>
      <span>Corporate Offices</span>
    </div>

    <div className="stat-card">
      <h3>2022</h3>
      <span>Established</span>
    </div>
  </div>

  {/* Cards */}
  <div className="why-grid">

    <div className="why-card">
      <h3>Affordable Packages</h3>

      <ul>
        <li>Accessible investment options</li>
        <li>Multiple business concepts</li>
        <li>Designed for aspiring entrepreneurs</li>
      </ul>
    </div>

    <div className="why-card">
      <h3>Business Training</h3>

      <ul>
        <li>Hands-on training</li>
        <li>Operations guidance</li>
        <li>Training manuals and support</li>
      </ul>
    </div>

    <div className="why-card">
      <h3>Marketing Support</h3>

      <ul>
        <li>Approved promotional materials</li>
        <li>Marketing guidance</li>
        <li>Online support assistance</li>
      </ul>
    </div>

    <div className="why-card">
      <h3>Business Registration Assistance</h3>

      <ul>
        <li>Permit guidance</li>
        <li>Documentary assistance</li>
        <li>Business setup support</li>
      </ul>
    </div>

    <div className="why-card">
      <h3>Nationwide Expansion Support</h3>

      <ul>
        <li>Continuous franchise assistance</li>
        <li>Business growth guidance</li>
        <li>Long-term partnership support</li>
      </ul>
    </div>

    <div className="why-card">
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
      <section className="portal-section">
        <h2>Already an MLSN Franchisee?</h2>

        <p>
          Access announcements, marketing
          materials, and Customer Service
          support through our Franchisee
          Portal.
        </p>

        <button
          type="button"
          className="login-button"
          onClick={onOpenLogin}
        >
          Open Franchisee Portal
        </button>
      </section>

      {/* CONTACT */}
      <section
        id="contact"
        className="website-section"
      >
        <h2>Contact Us</h2>

        <p>
          MLSN Franchising Solution
          Corporation
        </p>

        <p>Pasay City, Philippines</p>

        <p>
          Customer Service: 0916-306-7610
        </p>
      </section>

      {/* FOOTER */}
      <footer className="website-footer">
        © 2026 MLSN Franchising Solution
        Corporation
      </footer>
    </div>
  )
}

export default HomePage