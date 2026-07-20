import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import './App.css'
import logo from './assets/logo.png'
import Portal from './pages/Portal'
import AdminDashboard from './pages/AdminDashboard'
import HomePage from './pages/HomePage'

function App() {
  const [showLoginPage, setShowLoginPage] =
    useState(false)

  const [showPassword, setShowPassword] =
    useState(false)

  const [
    showNewPassword,
    setShowNewPassword,
  ] = useState(false)

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false)

  const [session, setSession] = useState(null)
  const [userRole, setUserRole] = useState(null)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [newPassword, setNewPassword] =
    useState('')

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState('')

  const [authPage, setAuthPage] =
    useState('login')

  const [errorMessage, setErrorMessage] =
    useState('')

  const [successMessage, setSuccessMessage] =
    useState('')

  const [loading, setLoading] = useState(true)

  const [isLoggingIn, setIsLoggingIn] =
    useState(false)

  const [
    isSendingReset,
    setIsSendingReset,
  ] = useState(false)

  const [
    isUpdatingPassword,
    setIsUpdatingPassword,
  ] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function initializeAuth() {
      const recoveryInUrl =
        window.location.hash.includes(
          'type=recovery'
        ) ||
        new URLSearchParams(
          window.location.search
        ).get('type') === 'recovery'

      if (recoveryInUrl && isMounted) {
        setAuthPage('recovery')
        setShowLoginPage(true)
      }

      await checkSession(recoveryInUrl)

      if (isMounted) {
        setLoading(false)
      }
    }

    initializeAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        if (!isMounted) {
          return
        }

        setSession(currentSession)

        if (event === 'PASSWORD_RECOVERY') {
          setAuthPage('recovery')
          setShowLoginPage(true)
          setUserRole(null)
          setErrorMessage('')
          setSuccessMessage('')
          setLoading(false)
          return
        }

        if (event === 'SIGNED_OUT') {
          setUserRole(null)
          setLoading(false)
          return
        }

        if (currentSession?.user) {
          setTimeout(async () => {
            if (!isMounted) {
              return
            }

            await fetchUserRole(
              currentSession.user.id
            )

            if (isMounted) {
              setLoading(false)
            }
          }, 0)
        } else {
          setUserRole(null)
          setLoading(false)
        }
      }
    )

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  async function checkSession(
    recoveryInUrl = false
  ) {
    const { data, error } =
      await supabase.auth.getSession()

    if (error) {
      console.error(
        'Error checking session:',
        error
      )

      setErrorMessage(error.message)
      return
    }

    const currentSession = data.session

    setSession(currentSession)

    if (
      currentSession?.user &&
      !recoveryInUrl
    ) {
      await fetchUserRole(
        currentSession.user.id
      )
    } else if (!currentSession) {
      setUserRole(null)
    }
  }

  async function fetchUserRole(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (error) {
      console.error(
        'Error loading role:',
        error
      )

      setUserRole(null)

      setErrorMessage(
        'Your account profile could not be loaded. Please contact the administrator.'
      )

      return null
    }

    const role = data?.role || null

    setUserRole(role)

    return role
  }

  function clearMessages() {
    setErrorMessage('')
    setSuccessMessage('')
  }

  function openLoginPage() {
    clearMessages()
    setAuthPage('login')
    setShowLoginPage(true)
  }

  function openForgotPassword() {
    clearMessages()
    setPassword('')
    setShowPassword(false)
    setAuthPage('forgot')
    setShowLoginPage(true)
  }

  function returnToLogin() {
    clearMessages()
    setPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setShowPassword(false)
    setShowNewPassword(false)
    setShowConfirmPassword(false)
    setAuthPage('login')
    setShowLoginPage(true)
  }

  function returnToWebsite() {
    clearMessages()
    setEmail('')
    setPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setShowPassword(false)
    setShowNewPassword(false)
    setShowConfirmPassword(false)
    setAuthPage('login')
    setShowLoginPage(false)
  }

  async function handleLogin(event) {
    event.preventDefault()

    clearMessages()

    if (!email.trim() || !password) {
      setErrorMessage(
        'Please enter your email address and password.'
      )
      return
    }

    setIsLoggingIn(true)

    try {
      const { data, error } =
        await supabase.auth.signInWithPassword({
          email: email
            .trim()
            .toLowerCase(),
          password,
        })

      if (error) {
        setErrorMessage(error.message)
        return
      }

      if (!data.session || !data.user) {
        setErrorMessage(
          'Login was not completed. Please try again.'
        )
        return
      }

      setSession(data.session)

      const role = await fetchUserRole(
        data.user.id
      )

      const validRoles = [
        'customer_service',
        'admin',
        'supervisor',
        'franchisee',
      ]

      if (!validRoles.includes(role)) {
        setErrorMessage(
          'Your account does not have a valid portal role.'
        )

        await supabase.auth.signOut()

        setSession(null)
        setUserRole(null)
        return
      }

      setEmail('')
      setPassword('')
    } catch (error) {
      console.error(
        'Unexpected login error:',
        error
      )

      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to log in.'
      )
    } finally {
      setIsLoggingIn(false)
    }
  }

  async function handleForgotPassword(event) {
    event.preventDefault()

    clearMessages()

    if (!email.trim()) {
      setErrorMessage(
        'Please enter your email address.'
      )
      return
    }

    setIsSendingReset(true)

    try {
      const redirectUrl =
        window.location.origin

      const { error } =
        await supabase.auth.resetPasswordForEmail(
          email.trim().toLowerCase(),
          {
            redirectTo: redirectUrl,
          }
        )

      if (error) {
        setErrorMessage(error.message)
        return
      }

      setSuccessMessage(
        'If an account exists for this email, a password reset link has been sent. Please check your inbox and spam folder.'
      )
    } catch (error) {
      console.error(
        'Unexpected password reset error:',
        error
      )

      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to send the password reset email.'
      )
    } finally {
      setIsSendingReset(false)
    }
  }

  async function handleUpdatePassword(event) {
    event.preventDefault()

    clearMessages()

    if (!newPassword || !confirmPassword) {
      setErrorMessage(
        'Please enter and confirm your new password.'
      )
      return
    }

    if (newPassword.length < 8) {
      setErrorMessage(
        'Your new password must contain at least 8 characters.'
      )
      return
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage(
        'The passwords do not match.'
      )
      return
    }

    setIsUpdatingPassword(true)

    try {
      const { error } =
        await supabase.auth.updateUser({
          password: newPassword,
        })

      if (error) {
        setErrorMessage(error.message)
        return
      }

      setNewPassword('')
      setConfirmPassword('')

      await supabase.auth.signOut()

      setSession(null)
      setUserRole(null)
      setShowLoginPage(true)

      window.history.replaceState(
        {},
        document.title,
        window.location.pathname
      )

      setAuthPage('login')

      setSuccessMessage(
        'Your password was updated successfully. Please log in using your new password.'
      )
    } catch (error) {
      console.error(
        'Unexpected update password error:',
        error
      )

      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to update your password.'
      )
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  async function handleLogout() {
    const { error } =
      await supabase.auth.signOut()

    if (error) {
      console.error(
        'Logout error:',
        error
      )
    }

    setSession(null)
    setUserRole(null)
    setEmail('')
    setPassword('')
    clearMessages()
    setAuthPage('login')
    setShowLoginPage(false)
  }

  const isAdminUser =
    userRole === 'customer_service' ||
    userRole === 'admin' ||
    userRole === 'supervisor'

  if (loading) {
    return (
      <div className="container">
        Loading...
      </div>
    )
  }

  if (authPage === 'recovery') {
    return (
      <div className="container">
        <form
          className="login-box"
          onSubmit={handleUpdatePassword}
        >
          <img
            src={logo}
            alt="MLSN Logo"
            className="logo"
          />

          <h1>Create New Password</h1>

          <p>
            Enter a new password for your
            portal account.
          </p>

          {errorMessage && (
            <div className="error-message">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="success-message">
              {successMessage}
            </div>
          )}

          <div className="password-wrapper">
            <input
              type={
                showNewPassword
                  ? 'text'
                  : 'password'
              }
              placeholder="New Password"
              value={newPassword}
              onChange={(event) =>
                setNewPassword(
                  event.target.value
                )
              }
              autoComplete="new-password"
              disabled={isUpdatingPassword}
            />

            <button
              type="button"
              className="show-password"
              onClick={() =>
                setShowNewPassword(
                  (currentValue) =>
                    !currentValue
                )
              }
              disabled={isUpdatingPassword}
            >
              {showNewPassword
                ? 'Hide'
                : 'Show'}
            </button>
          </div>

          <div className="password-wrapper">
            <input
              type={
                showConfirmPassword
                  ? 'text'
                  : 'password'
              }
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(
                  event.target.value
                )
              }
              autoComplete="new-password"
              disabled={isUpdatingPassword}
            />

            <button
              type="button"
              className="show-password"
              onClick={() =>
                setShowConfirmPassword(
                  (currentValue) =>
                    !currentValue
                )
              }
              disabled={isUpdatingPassword}
            >
              {showConfirmPassword
                ? 'Hide'
                : 'Show'}
            </button>
          </div>

          <button
            type="submit"
            disabled={isUpdatingPassword}
          >
            {isUpdatingPassword
              ? 'Updating Password...'
              : 'Update Password'}
          </button>

          <button
            type="button"
            className="back-button"
            onClick={returnToLogin}
            disabled={isUpdatingPassword}
          >
            ← Back to Login
          </button>

          <footer className="footer">
            <p>
              © 2026 MLSN Franchising
              Solution Corporation
            </p>

            <p>All Rights Reserved</p>
          </footer>
        </form>
      </div>
    )
  }

  if (session && isAdminUser) {
    return (
      <AdminDashboard
        onLogout={handleLogout}
      />
    )
  }

  if (
    session &&
    userRole === 'franchisee'
  ) {
    return (
      <Portal onLogout={handleLogout} />
    )
  }

  if (authPage === 'forgot') {
    return (
      <div className="container">
        <form
          className="login-box"
          onSubmit={handleForgotPassword}
        >
          <img
            src={logo}
            alt="MLSN Logo"
            className="logo"
          />

          <h1>Forgot Password</h1>

          <p>
            Enter your registered email
            address. We will send you a link
            to create a new password.
          </p>

          {errorMessage && (
            <div className="error-message">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="success-message">
              {successMessage}
            </div>
          )}

          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            autoComplete="email"
            disabled={isSendingReset}
          />

          <button
            type="submit"
            disabled={isSendingReset}
          >
            {isSendingReset
              ? 'Sending Reset Link...'
              : 'Send Reset Link'}
          </button>

          <button
            type="button"
            className="back-button"
            onClick={returnToLogin}
            disabled={isSendingReset}
          >
            ← Back to Login
          </button>

          <footer className="footer">
            <p>
              © 2026 MLSN Franchising
              Solution Corporation
            </p>

            <p>All Rights Reserved</p>
          </footer>
        </form>
      </div>
    )
  }

  if (!showLoginPage && !session) {
    return (
      <HomePage
        onOpenLogin={openLoginPage}
      />
    )
  }

  return (
    <div className="container">
      <form
        className="login-box"
        onSubmit={handleLogin}
      >
        <img
          src={logo}
          alt="MLSN Logo"
          className="logo"
        />

        <h1>
          MLSN Franchisee Portal
        </h1>

        <p>
          Log in to access Customer Service
          support and your franchise account.
        </p>

        {errorMessage && (
          <div className="error-message">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="success-message">
            {successMessage}
          </div>
        )}

        <input
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(event) =>
            setEmail(event.target.value)
          }
          autoComplete="email"
          disabled={isLoggingIn}
        />

        <div className="password-wrapper">
          <input
            type={
              showPassword
                ? 'text'
                : 'password'
            }
            placeholder="Password"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            autoComplete="current-password"
            disabled={isLoggingIn}
          />

          <button
            type="button"
            className="show-password"
            onClick={() =>
              setShowPassword(
                (currentValue) =>
                  !currentValue
              )
            }
            disabled={isLoggingIn}
          >
            {showPassword
              ? 'Hide'
              : 'Show'}
          </button>
        </div>

        <div className="login-options">
          <label>
            <input type="checkbox" />
            Remember me
          </label>

          <button
            type="button"
            className="forgot-password-link"
            onClick={openForgotPassword}
          >
            Forgot Password?
          </button>
        </div>

        <button
          type="submit"
          disabled={isLoggingIn}
        >
          {isLoggingIn
            ? 'Logging in...'
            : 'Login'}
        </button>

        <button
          type="button"
          className="back-button"
          onClick={returnToWebsite}
          disabled={isLoggingIn}
        >
          ← Back to Website
        </button>

        <footer className="footer">
          <p>
            © 2026 MLSN Franchising
            Solution Corporation
          </p>

          <p>All Rights Reserved</p>
        </footer>
      </form>
    </div>
  )
}

export default App