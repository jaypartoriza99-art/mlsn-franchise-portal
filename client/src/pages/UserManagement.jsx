import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

function UserManagement({ onBack, currentUserRole }) {
  const franchisePackages = [
    'Inasal Express',
    'All Time Favorite',
    'The Purple Blend & Crispy Fries',
   
  ]

  const getAvailableRoles = () => {
    if (currentUserRole === 'admin') {
      return [
        {
          value: 'admin',
          label: 'Administrator',
        },
        {
          value: 'supervisor',
          label: 'Supervisor',
        },
        {
          value: 'customer_service',
          label: 'Customer Service',
        },
        {
          value: 'franchisee',
          label: 'Franchisee',
        },
      ]
    }

    if (currentUserRole === 'supervisor') {
      return [
        {
          value: 'customer_service',
          label: 'Customer Service',
        },
        {
          value: 'franchisee',
          label: 'Franchisee',
        },
      ]
    }

    return [
      {
        value: 'franchisee',
        label: 'Franchisee',
      },
    ]
  }

  const availableRoles = getAvailableRoles()

  const defaultRole =
    availableRoles[0]?.value || 'franchisee'

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')

  const [
    temporaryPassword,
    setTemporaryPassword,
  ] = useState('')

  const [role, setRole] = useState(defaultRole)

  const [department, setDepartment] =
    useState('Customer Service')

  const [franchiseName, setFranchiseName] =
    useState('')

  const [
    franchisePackage,
    setFranchisePackage,
  ] = useState('')

  const [successMessage, setSuccessMessage] =
    useState('')

  const [errorMessage, setErrorMessage] =
    useState('')

  const [isCreating, setIsCreating] =
    useState(false)

  useEffect(() => {
    const rolesAllowedForCurrentUser =
      getAvailableRoles().map(
        (roleOption) => roleOption.value
      )

    if (
      !rolesAllowedForCurrentUser.includes(role)
    ) {
      setRole(
        rolesAllowedForCurrentUser[0] ||
          'franchisee'
      )
    }
  }, [currentUserRole])

  function resetForm() {
    const resetRole =
      getAvailableRoles()[0]?.value ||
      'franchisee'

    setFullName('')
    setEmail('')
    setTemporaryPassword('')
    setRole(resetRole)
    setDepartment('Customer Service')
    setFranchiseName('')
    setFranchisePackage('')
  }

  async function handleCreateUser(event) {
    event.preventDefault()

    setSuccessMessage('')
    setErrorMessage('')

    if (
      !fullName.trim() ||
      !email.trim() ||
      !temporaryPassword
    ) {
      setErrorMessage(
        'Please complete the name, email, and temporary password.'
      )
      return
    }

    if (temporaryPassword.length < 6) {
      setErrorMessage(
        'The temporary password must contain at least 6 characters.'
      )
      return
    }

    if (
      role === 'franchisee' &&
      !franchiseName.trim()
    ) {
      setErrorMessage(
        'Please enter the franchise name.'
      )
      return
    }

    if (
      role === 'franchisee' &&
      !franchisePackage
    ) {
      setErrorMessage(
        'Please select the franchise package.'
      )
      return
    }

    const allowedRoleValues =
      availableRoles.map(
        (roleOption) => roleOption.value
      )

    if (!allowedRoleValues.includes(role)) {
      setErrorMessage(
        'You are not allowed to create this type of account.'
      )
      return
    }

    setIsCreating(true)

    try {
      const { data, error } =
        await supabase.functions.invoke(
          'create-portal-user',
          {
            body: {
              full_name: fullName.trim(),

              email: email
                .trim()
                .toLowerCase(),

              password: temporaryPassword,

              role,

              department:
                role === 'franchisee'
                  ? null
                  : department.trim() ||
                    null,

              franchise_name:
                role === 'franchisee'
                  ? franchiseName.trim()
                  : null,

              franchise_package:
                role === 'franchisee'
                  ? franchisePackage
                  : null,
            },
          }
        )

      if (error) {
        console.error(
          'Create user function error:',
          error
        )

        let message = error.message

        try {
          const errorBody =
            await error.context?.json()

          if (errorBody?.error) {
            message = errorBody.error
          }
        } catch {
          // Keep the original error message.
        }

        setErrorMessage(message)
        return
      }

      if (data?.error) {
        setErrorMessage(data.error)
        return
      }

      setSuccessMessage(
        `${fullName.trim()} was created successfully.`
      )

      resetForm()
    } catch (error) {
      console.error(
        'Unexpected create user error:',
        error
      )

      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to create the user.'
      )
    } finally {
      setIsCreating(false)
    }
  }

  const roleDescription = {
    admin:
      'You can create administrator, supervisor, Customer Service, and franchisee accounts.',

    supervisor:
      'You can create Customer Service and franchisee accounts.',

    customer_service:
      'You can create franchisee accounts only.',
  }

  return (
    <>
      <div className="page-header">
        <h1>User Management</h1>

        <p>
          {roleDescription[currentUserRole] ||
            'Create authorized portal accounts.'}
        </p>
      </div>

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

      <form
        className="concern-form user-management-form"
        onSubmit={handleCreateUser}
      >
        <label>Full Name</label>

        <input
          type="text"
          placeholder="Enter the employee or franchisee name"
          value={fullName}
          onChange={(event) =>
            setFullName(event.target.value)
          }
          disabled={isCreating}
        />

        <label>Email Address</label>

        <input
          type="email"
          placeholder="example@mlsn.com"
          value={email}
          onChange={(event) =>
            setEmail(event.target.value)
          }
          disabled={isCreating}
        />

        <label>Temporary Password</label>

        <input
          type="password"
          placeholder="At least 6 characters"
          value={temporaryPassword}
          onChange={(event) =>
            setTemporaryPassword(
              event.target.value
            )
          }
          disabled={isCreating}
        />

        <label>Role</label>

{availableRoles.length === 1 ? (
  <input
    type="text"
    value="Franchisee"
    disabled
  />
) : (
  <select
    value={role}
    onChange={(event) => {
      const selectedRole =
        event.target.value

      setRole(selectedRole)

      setErrorMessage('')
      setSuccessMessage('')

      if (
        selectedRole ===
        'customer_service'
      ) {
        setDepartment(
          'Customer Service'
        )
      }

      if (
        selectedRole ===
        'franchisee'
      ) {
        setDepartment('')
      } else {
        setFranchiseName('')
        setFranchisePackage('')
      }
    }}
    disabled={isCreating}
  >
    {availableRoles.map(
      (roleOption) => (
        <option
          key={roleOption.value}
          value={roleOption.value}
        >
          {roleOption.label}
        </option>
      )
    )}
  </select>
)}

        {role === 'franchisee' ? (
          <>
            <label>Franchise Name</label>

            <input
              type="text"
              placeholder="Enter the franchise name"
              value={franchiseName}
              onChange={(event) =>
                setFranchiseName(
                  event.target.value
                )
              }
              disabled={isCreating}
            />

            <label>Franchise Package</label>

            <select
              value={franchisePackage}
              onChange={(event) =>
                setFranchisePackage(
                  event.target.value
                )
              }
              disabled={isCreating}
            >
              <option value="">
                Select franchise package
              </option>

              {franchisePackages.map(
                (packageName) => (
                  <option
                    key={packageName}
                    value={packageName}
                  >
                    {packageName}
                  </option>
                )
              )}
            </select>
          </>
        ) : (
          <>
            <label>Department</label>

            <input
              type="text"
              placeholder="Example: Customer Service"
              value={department}
              onChange={(event) =>
                setDepartment(
                  event.target.value
                )
              }
              disabled={isCreating}
            />
          </>
        )}

        <button
          type="submit"
          disabled={isCreating}
        >
          {isCreating
            ? 'Creating Account...'
            : 'Create User Account'}
        </button>
      </form>

      <button
        type="button"
        className="back-button"
        onClick={onBack}
        disabled={isCreating}
      >
        ← Back to Dashboard
      </button>
    </>
  )
}

export default UserManagement