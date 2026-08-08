import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

function UserManagement({
  onBack,
  currentUserRole,
}) {

  const emptyFranchiseForm = {
    contactNumber: '',
    storeName: '',
    franchisePackage: '',
    franchiseConcept: '',
    packageConceptId: '',
    marketingMaterialsLink: '',
    franchiseDate: '',
    marketingConsultant: '',
    region: '',
    province: '',
    cityMunicipality: '',
    storeAddress: '',
  }

  const getAvailableRoles = () => {
    const normalizedRole =
      currentUserRole
        ?.trim()
        .toLowerCase()

    if (normalizedRole === 'supervisor') {
      return [
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

    if (
      normalizedRole ===
      'customer_service'
    ) {
      return [
        {
          value: 'franchisee',
          label: 'Franchisee',
        },
      ]
    }

    return []
  }

  const availableRoles =
    getAvailableRoles()

  const normalizedCurrentUserRole =
    currentUserRole
      ?.trim()
      .toLowerCase()

  const defaultRole =
    availableRoles[0]?.value ||
    'franchisee'

  const [fullName, setFullName] =
    useState('')

  const [email, setEmail] =
    useState('')

  const [
    temporaryPassword,
    setTemporaryPassword,
  ] = useState('')

  const [role, setRole] =
    useState(defaultRole)

  const [department, setDepartment] =
    useState('Customer Service')

  const [
    franchiseForm,
    setFranchiseForm,
  ] = useState(emptyFranchiseForm)

  const [
    packageCatalog,
    setPackageCatalog,
  ] = useState([])

  const [
    isLoadingPackages,
    setIsLoadingPackages,
  ] = useState(false)

  const [
    franchisees,
    setFranchisees,
  ] = useState([])

  const [
    selectedFranchisee,
    setSelectedFranchisee,
  ] = useState(null)

  const [
    editForm,
    setEditForm,
  ] = useState(emptyFranchiseForm)

  const [
    franchiseSearch,
    setFranchiseSearch,
  ] = useState('')

  const [
    successMessage,
    setSuccessMessage,
  ] = useState('')

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('')

  const [
    isCreating,
    setIsCreating,
  ] = useState(false)

  const [
    isUpdating,
    setIsUpdating,
  ] = useState(false)

  const [
    isLoadingFranchisees,
    setIsLoadingFranchisees,
  ] = useState(false)

  useEffect(() => {
    const rolesAllowedForCurrentUser =
      getAvailableRoles().map(
        (roleOption) =>
          roleOption.value
      )

    if (
      !rolesAllowedForCurrentUser.includes(
        role
      )
    ) {
      setRole(
        rolesAllowedForCurrentUser[0] ||
          'franchisee'
      )
    }
  }, [currentUserRole])

  useEffect(() => {
    fetchPackageCatalog()
    fetchFranchisees()
  }, [])

  async function fetchPackageCatalog() {
    setIsLoadingPackages(true)

    const {
      data,
      error,
    } = await supabase
      .from('package_concepts')
      .select(`
        id,
        package_type_id,
        concept_id,
        marketing_materials_link,
        display_order,
        franchise_package_types (
          id,
          package_name,
          display_order
        ),
        franchise_concepts (
          id,
          concept_name
        )
      `)
      .eq('is_active', true)

    if (error) {
      console.error(
        'Error loading package catalog:',
        error
      )

      setErrorMessage(error.message)
      setIsLoadingPackages(false)
      return
    }

    const sortedCatalog = (data || [])
      .filter(
        (item) =>
          item.franchise_package_types &&
          item.franchise_concepts
      )
      .sort((firstItem, secondItem) => {
        const packageDifference =
          (firstItem.franchise_package_types
            ?.display_order || 0) -
          (secondItem.franchise_package_types
            ?.display_order || 0)

        if (packageDifference !== 0) {
          return packageDifference
        }

        return (
          (firstItem.display_order || 0) -
          (secondItem.display_order || 0)
        )
      })

    setPackageCatalog(sortedCatalog)
    setIsLoadingPackages(false)
  }

  const packageTypes = Array.from(
    new Map(
      packageCatalog.map((item) => [
        item.package_type_id,
        {
          id: item.package_type_id,
          packageName:
            item.franchise_package_types
              .package_name,
          displayOrder:
            item.franchise_package_types
              .display_order,
        },
      ])
    ).values()
  ).sort(
    (firstPackage, secondPackage) =>
      firstPackage.displayOrder -
      secondPackage.displayOrder
  )

  function getConceptOptions(packageName) {
    if (!packageName) {
      return []
    }

    return packageCatalog
      .filter(
        (item) =>
          item.franchise_package_types
            ?.package_name === packageName
      )
      .map((item) => ({
        packageConceptId: item.id,
        conceptName:
          item.franchise_concepts
            ?.concept_name || '',
        marketingMaterialsLink:
          item.marketing_materials_link || '',
        displayOrder:
          item.display_order || 0,
      }))
      .sort(
        (firstConcept, secondConcept) =>
          firstConcept.displayOrder -
          secondConcept.displayOrder
      )
  }

  function updateFranchiseForm(
    field,
    value
  ) {
    setFranchiseForm(
      (currentForm) => ({
        ...currentForm,
        [field]: value,
      })
    )
  }

  function updateEditForm(
    field,
    value
  ) {
    setEditForm(
      (currentForm) => ({
        ...currentForm,
        [field]: value,
      })
    )
  }

  function resetForm() {
    const resetRole =
      getAvailableRoles()[0]?.value ||
      'franchisee'

    setFullName('')
    setEmail('')
    setTemporaryPassword('')
    setRole(resetRole)
    setDepartment(
      'Customer Service'
    )
    setFranchiseForm(
      emptyFranchiseForm
    )
  }

  async function fetchFranchisees() {
    setIsLoadingFranchisees(true)

    const {
      data: franchiseData,
      error: franchiseError,
    } = await supabase
      .from('franchisees')
      .select('*')
      .order('created_at', {
        ascending: false,
      })

    if (franchiseError) {
      console.error(
        'Error loading franchisees:',
        franchiseError
      )

      setErrorMessage(
        franchiseError.message
      )
      setIsLoadingFranchisees(false)
      return
    }

    const userIds = [
      ...new Set(
        (franchiseData || [])
          .map(
            (franchisee) =>
              franchisee.user_id
          )
          .filter(Boolean)
      ),
    ]

    let profileMap = {}

    if (userIds.length > 0) {
      const {
        data: profiles,
        error: profilesError,
      } = await supabase
        .from('profiles')
        .select(
          'id, full_name, email'
        )
        .in('id', userIds)

      if (profilesError) {
        console.error(
          'Error loading franchisee profiles:',
          profilesError
        )
      } else {
        ;(profiles || []).forEach(
          (profile) => {
            profileMap[
              profile.id
            ] = profile
          }
        )
      }
    }

    const enrichedFranchisees =
      (franchiseData || []).map(
        (franchisee) => ({
          ...franchisee,
          full_name:
            profileMap[
              franchisee.user_id
            ]?.full_name ||
            'Unknown Franchisee',
          email:
            profileMap[
              franchisee.user_id
            ]?.email ||
            '',
        })
      )

    setFranchisees(
      enrichedFranchisees
    )

    setIsLoadingFranchisees(false)
  }

  function openFranchiseeEditor(
    franchisee
  ) {
    setSelectedFranchisee(
      franchisee
    )

    const matchedPackageConcept =
      packageCatalog.find(
        (item) =>
          item.franchise_package_types
            ?.package_name ===
            franchisee.franchise_package &&
          item.franchise_concepts
            ?.concept_name ===
            franchisee.franchise_concept
      )

    setEditForm({
      contactNumber:
        franchisee.contact_number ||
        '',
      storeName:
        franchisee.store_name || '',
      franchisePackage:
        franchisee.franchise_package ||
        '',
      franchiseConcept:
        franchisee.franchise_concept ||
        '',
      packageConceptId:
        franchisee.package_concept_id ||
        matchedPackageConcept?.id ||
        '',
      marketingMaterialsLink:
        franchisee.marketing_materials_link ||
        matchedPackageConcept
          ?.marketing_materials_link ||
        '',
      franchiseDate:
        franchisee.franchise_date ||
        '',
      marketingConsultant:
        franchisee.marketing_consultant ||
        '',
      region:
        franchisee.region || '',
      province:
        franchisee.province || '',
      cityMunicipality:
        franchisee.city_municipality ||
        '',
      storeAddress:
        franchisee.store_address ||
        '',
    })

    setSuccessMessage('')
    setErrorMessage('')
  }

  async function handleUpdateFranchisee(
    event
  ) {
    event.preventDefault()

    if (!selectedFranchisee) {
      return
    }

    if (
      !editForm.storeName.trim() ||
      !editForm.franchisePackage ||
      !editForm.franchiseConcept
    ) {
      setErrorMessage(
        'Please complete the store name, package type, and franchise concept.'
      )
      return
    }

    setIsUpdating(true)
    setSuccessMessage('')
    setErrorMessage('')

    const {
      error,
    } = await supabase
      .from('franchisees')
      .update({
        contact_number:
          editForm.contactNumber.trim() ||
          null,


        store_name:
          editForm.storeName.trim(),

        franchise_package:
          editForm.franchisePackage,

        franchise_concept:
          editForm.franchiseConcept,

        package_concept_id:
          editForm.packageConceptId ||
          null,

        marketing_materials_link:
          editForm.marketingMaterialsLink ||
          null,

        franchise_date:
          editForm.franchiseDate ||
          null,

        marketing_consultant:
          editForm.marketingConsultant.trim() ||
          null,

        region:
          editForm.region.trim() ||
          null,

        province:
          editForm.province.trim() ||
          null,

        city_municipality:
          editForm.cityMunicipality.trim() ||
          null,

        store_address:
          editForm.storeAddress.trim() ||
          null,

        updated_at:
          new Date().toISOString(),
      })
      .eq(
        'id',
        selectedFranchisee.id
      )

    if (error) {
      console.error(
        'Error updating franchisee:',
        error
      )

      setErrorMessage(error.message)
      setIsUpdating(false)
      return
    }

    setSuccessMessage(
      `${selectedFranchisee.full_name}'s franchise information was updated successfully.`
    )

    setSelectedFranchisee(null)
    setEditForm(emptyFranchiseForm)
    await fetchFranchisees()
    setIsUpdating(false)
  }

  async function handleCreateUser(
    event
  ) {
    event.preventDefault()

    setSuccessMessage('')
    setErrorMessage('')

    if (
      availableRoles.length === 0
    ) {
      setErrorMessage(
        'You are not authorized to create portal accounts.'
      )
      return
    }

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

    if (
      temporaryPassword.length < 6
    ) {
      setErrorMessage(
        'The temporary password must contain at least 6 characters.'
      )
      return
    }

    if (
      role === 'franchisee' &&
      !franchiseForm.storeName.trim()
    ) {
      setErrorMessage(
        'Please enter the store name.'
      )
      return
    }

    if (
      role === 'franchisee' &&
      !franchiseForm.franchisePackage
    ) {
      setErrorMessage(
        'Please select the package type.'
      )
      return
    }

    if (
      role === 'franchisee' &&
      !franchiseForm.franchiseConcept
    ) {
      setErrorMessage(
        'Please select the franchise concept.'
      )
      return
    }

    const allowedRoleValues =
      availableRoles.map(
        (roleOption) =>
          roleOption.value
      )

    if (
      !allowedRoleValues.includes(role)
    ) {
      setErrorMessage(
        'You are not allowed to create this type of account.'
      )
      return
    }

    setIsCreating(true)

    try {
      const {
        data,
        error,
      } =
        await supabase.functions.invoke(
          'create-portal-user',
          {
            body: {
              full_name:
                fullName.trim(),

              email: email
                .trim()
                .toLowerCase(),

              password:
                temporaryPassword,

              role,

              department:
                role === 'franchisee'
                  ? null
                  : department.trim() ||
                    null,

              franchise_name:
                role === 'franchisee'
                  ? franchiseForm.storeName.trim()
                  : null,

              franchise_package:
                role === 'franchisee'
                  ? franchiseForm.franchisePackage
                  : null,

              franchise_concept:
                role === 'franchisee'
                  ? franchiseForm.franchiseConcept
                  : null,

              package_concept_id:
                role === 'franchisee'
                  ? franchiseForm.packageConceptId ||
                    null
                  : null,

              marketing_materials_link:
                role === 'franchisee'
                  ? franchiseForm.marketingMaterialsLink ||
                    null
                  : null,

              contact_number:
                role === 'franchisee'
                  ? franchiseForm.contactNumber.trim() ||
                    null
                  : null,


              store_name:
                role === 'franchisee'
                  ? franchiseForm.storeName.trim()
                  : null,

              franchise_date:
                role === 'franchisee'
                  ? franchiseForm.franchiseDate ||
                    null
                  : null,

              marketing_consultant:
                role === 'franchisee'
                  ? franchiseForm.marketingConsultant.trim() ||
                    null
                  : null,

              region:
                role === 'franchisee'
                  ? franchiseForm.region.trim() ||
                    null
                  : null,

              province:
                role === 'franchisee'
                  ? franchiseForm.province.trim() ||
                    null
                  : null,

              city_municipality:
                role === 'franchisee'
                  ? franchiseForm.cityMunicipality.trim() ||
                    null
                  : null,

              store_address:
                role === 'franchisee'
                  ? franchiseForm.storeAddress.trim() ||
                    null
                  : null,
            },
          }
        )

      if (error) {
        console.error(
          'Create user function error:',
          error
        )

        let message =
          error.message

        try {
          const errorBody =
            await error.context?.json()

          if (errorBody?.error) {
            message =
              errorBody.error
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
      await fetchFranchisees()
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
    supervisor:
      'You can create Supervisor, Customer Service, and franchisee accounts, and update franchisee information.',

    customer_service:
      'You can create franchisee accounts and update franchisee information.',
  }

  const filteredFranchisees =
    franchisees.filter(
      (franchisee) => {
        const search =
          franchiseSearch
            .trim()
            .toLowerCase()

        if (!search) {
          return true
        }

        return (
          franchisee.full_name
            ?.toLowerCase()
            .includes(search) ||
          franchisee.email
            ?.toLowerCase()
            .includes(search) ||
          franchisee.store_name
            ?.toLowerCase()
            .includes(search) ||
          franchisee.franchise_package
            ?.toLowerCase()
            .includes(search) ||
          franchisee.franchise_concept
            ?.toLowerCase()
            .includes(search) ||
          franchisee.marketing_consultant
            ?.toLowerCase()
            .includes(search) ||
          franchisee.region
            ?.toLowerCase()
            .includes(search) ||
          franchisee.province
            ?.toLowerCase()
            .includes(search) ||
          franchisee.city_municipality
            ?.toLowerCase()
            .includes(search)
        )
      }
    )

  function renderFranchiseFields(
    form,
    updateForm,
    disabled
  ) {
    return (
      <>
        <label>
          Contact Number
        </label>

        <input
          type="text"
          placeholder="Example: 0917 123 4567"
          value={
            form.contactNumber
          }
          onChange={(event) =>
            updateForm(
              'contactNumber',
              event.target.value
            )
          }
          disabled={disabled}
        />


        <label>Store Name</label>

        <input
          type="text"
          placeholder="Enter the store or franchise name"
          value={form.storeName}
          onChange={(event) =>
            updateForm(
              'storeName',
              event.target.value
            )
          }
          disabled={disabled}
        />

        <label>
          Package Type
        </label>

        <select
          value={form.franchisePackage}
          onChange={(event) => {
            updateForm(
              'franchisePackage',
              event.target.value
            )
            updateForm(
              'franchiseConcept',
              ''
            )
            updateForm(
              'packageConceptId',
              ''
            )
            updateForm(
              'marketingMaterialsLink',
              ''
            )
          }}
          disabled={
            disabled ||
            isLoadingPackages
          }
        >
          <option value="">
            {isLoadingPackages
              ? 'Loading package types...'
              : 'Select package type'}
          </option>

          {packageTypes.map(
            (packageType) => (
              <option
                key={packageType.id}
                value={
                  packageType.packageName
                }
              >
                {packageType.packageName}
              </option>
            )
          )}
        </select>

        <label>
          Franchise Concept
        </label>

        <select
          value={form.packageConceptId}
          onChange={(event) => {
            const selectedOption =
              getConceptOptions(
                form.franchisePackage
              ).find(
                (option) =>
                  option.packageConceptId ===
                  event.target.value
              )

            updateForm(
              'packageConceptId',
              selectedOption
                ?.packageConceptId || ''
            )
            updateForm(
              'franchiseConcept',
              selectedOption
                ?.conceptName || ''
            )
            updateForm(
              'marketingMaterialsLink',
              selectedOption
                ?.marketingMaterialsLink || ''
            )
          }}
          disabled={
            disabled ||
            isLoadingPackages ||
            !form.franchisePackage
          }
        >
          <option value="">
            {form.franchisePackage
              ? 'Select franchise concept'
              : 'Select a package type first'}
          </option>

          {getConceptOptions(
            form.franchisePackage
          ).map((conceptOption) => (
            <option
              key={
                conceptOption.packageConceptId
              }
              value={
                conceptOption.packageConceptId
              }
            >
              {conceptOption.conceptName}
            </option>
          ))}
        </select>

        {form.marketingMaterialsLink && (
          <a
            href={
              form.marketingMaterialsLink
            }
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'inline-block',
              marginBottom: '14px',
            }}
          >
            📁 Open Marketing Materials
          </a>
        )}

        <label>
          Franchise Date
        </label>

        <input
          type="date"
          value={form.franchiseDate}
          onChange={(event) =>
            updateForm(
              'franchiseDate',
              event.target.value
            )
          }
          disabled={disabled}
        />

        <label>
          Marketing Consultant
        </label>

        <input
          type="text"
          placeholder="Enter the original Marketing Consultant"
          value={
            form.marketingConsultant
          }
          onChange={(event) =>
            updateForm(
              'marketingConsultant',
              event.target.value
            )
          }
          disabled={disabled}
        />

        <label>Region</label>

        <input
          type="text"
          placeholder="Example: Region IV-A"
          value={form.region}
          onChange={(event) =>
            updateForm(
              'region',
              event.target.value
            )
          }
          disabled={disabled}
        />

        <label>Province</label>

        <input
          type="text"
          placeholder="Example: Laguna"
          value={form.province}
          onChange={(event) =>
            updateForm(
              'province',
              event.target.value
            )
          }
          disabled={disabled}
        />

        <label>
          City / Municipality
        </label>

        <input
          type="text"
          placeholder="Example: Santa Rosa"
          value={
            form.cityMunicipality
          }
          onChange={(event) =>
            updateForm(
              'cityMunicipality',
              event.target.value
            )
          }
          disabled={disabled}
        />

        <label>
          Store Address
        </label>

        <textarea
          placeholder="Enter the complete store address"
          value={
            form.storeAddress
          }
          onChange={(event) =>
            updateForm(
              'storeAddress',
              event.target.value
            )
          }
          disabled={disabled}
          rows="3"
        />
      </>
    )
  }

  const totalFranchisees =
    franchisees.length

  const visibleFranchisees =
    filteredFranchisees.length

  const uniquePackages =
    new Set(
      franchisees
        .map(
          (franchisee) =>
            franchisee.franchise_package
        )
        .filter(Boolean)
    ).size

  const uniqueRegions =
    new Set(
      franchisees
        .map(
          (franchisee) =>
            franchisee.region
        )
        .filter(Boolean)
    ).size

  return (
    <div className="user-management-page">
      <section className="user-management-hero">
        <div>
          <span className="user-management-eyebrow">
            Portal Administration
          </span>

          <h1>User Management</h1>

          <p>
            {roleDescription[
              normalizedCurrentUserRole
            ] ||
              'You are not authorized to create portal accounts.'}
          </p>
        </div>

        <button
          type="button"
          className="user-management-back"
          onClick={onBack}
          disabled={
            isCreating ||
            isUpdating
          }
        >
          ← Back to Dashboard
        </button>
      </section>

      <section className="user-management-kpis">
        <article>
          <span>Total Franchisees</span>
          <strong>{totalFranchisees}</strong>
        </article>

        <article>
          <span>Visible Results</span>
          <strong>{visibleFranchisees}</strong>
        </article>

        <article>
          <span>Package Types</span>
          <strong>{uniquePackages}</strong>
        </article>

        <article>
          <span>Regions Covered</span>
          <strong>{uniqueRegions}</strong>
        </article>
      </section>
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

      {availableRoles.length > 0 ? (
        <>
          <form
            className="concern-form user-management-form user-management-create-card"
            onSubmit={
              handleCreateUser
            }
          >
            <div className="user-management-section-heading">
              <div>
                <span>Account Setup</span>
                <h2>Create Portal Account</h2>
                <p>
                  Create staff or franchisee access with the correct role and details.
                </p>
              </div>
            </div>

            <div className="user-management-form-grid">
              <div className="user-management-field">

                <label>Full Name</label>

                <input
              type="text"
              placeholder="Enter the employee or franchisee name"
              value={fullName}
              onChange={(event) =>
                setFullName(
                  event.target.value
                )
              }
              disabled={isCreating}
            />

              </div>

              <div className="user-management-field">
                <label>
                  Email Address
                </label>

                <input
              type="email"
              placeholder="example@mlsn.com"
              value={email}
              onChange={(event) =>
                setEmail(
                  event.target.value
                )
              }
              disabled={isCreating}
            />

              </div>

              <div className="user-management-field">
                <label>
                  Temporary Password
                </label>

                <input
              type="password"
              placeholder="At least 6 characters"
              value={
                temporaryPassword
              }
              onChange={(event) =>
                setTemporaryPassword(
                  event.target.value
                )
              }
              disabled={isCreating}
            />

              </div>

              <div className="user-management-field">
                <label>Role</label>

                {availableRoles.length ===
            1 ? (
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

                  setRole(
                    selectedRole
                  )

                  setErrorMessage('')
                  setSuccessMessage('')

                  if (
                    selectedRole ===
                      'customer_service' ||
                    selectedRole ===
                      'supervisor'
                  ) {
                    setDepartment(
                      'Customer Service'
                    )
                  } else {
                    setDepartment('')
                  }

                  if (
                    selectedRole !==
                    'franchisee'
                  ) {
                    setFranchiseForm(
                      emptyFranchiseForm
                    )
                  }
                }}
                disabled={isCreating}
              >
                {availableRoles.map(
                  (roleOption) => (
                    <option
                      key={
                        roleOption.value
                      }
                      value={
                        roleOption.value
                      }
                    >
                      {
                        roleOption.label
                      }
                    </option>
                  )
                )}
              </select>
            )}

              </div>
            </div>

            {role ===
            'franchisee' ? (
              <>
                <div className="user-management-subsection">
                  <span>Business Profile</span>
                  <h3>Franchise Information</h3>
                </div>

                {renderFranchiseFields(
                  franchiseForm,
                  updateFranchiseForm,
                  isCreating
                )}
              </>
            ) : (
              <>
                <label>
                  Department
                </label>

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

          <section className="recent-section user-management-directory">
            <h2>
              Update Franchisee Information
            </h2>

            <p>
              Supervisor and Customer
              Service may update a
              franchisee's business
              information when needed.
            </p>

            <input
              type="text"
              placeholder="Search by name, email, store, package, concept, consultant, or location..."
              value={franchiseSearch}
              onChange={(event) =>
                setFranchiseSearch(
                  event.target.value
                )
              }
            />

            {isLoadingFranchisees ? (
              <p>
                Loading franchisees...
              </p>
            ) : (
              <table className="user-management-table">
                <thead>
                  <tr>
                    <th>
                      Franchisee
                    </th>
                    <th>Store</th>
                    <th>Package</th>
                    <th>Concept</th>
                    <th>Materials</th>
                    <th>
                      Marketing Consultant
                    </th>
                    <th>
                      Location
                    </th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredFranchisees.length ===
                  0 ? (
                    <tr>
                      <td colSpan="8">
                        No franchisee
                        records found.
                      </td>
                    </tr>
                  ) : (
                    filteredFranchisees.map(
                      (franchisee) => (
                        <tr
                          key={
                            franchisee.id
                          }
                        >
                          <td>
                            <strong>
                              {
                                franchisee.full_name
                              }
                            </strong>
                            <br />
                            <small>
                              {
                                franchisee.email
                              }
                            </small>
                          </td>


                          <td>
                            {franchisee.store_name ||
                              'N/A'}
                          </td>

                          <td>
                            {franchisee.franchise_package ||
                              'N/A'}
                          </td>

                          <td>
                            {franchisee.franchise_concept ||
                              'N/A'}
                          </td>

                          <td>
                            {franchisee.marketing_materials_link ? (
                              <a
                                href={franchisee.marketing_materials_link}
                                target="_blank"
                                rel="noreferrer"
                              >
                                📁 Open Folder
                              </a>
                            ) : (
                              'N/A'
                            )}
                          </td>

                          <td>
                            {franchisee.marketing_consultant ||
                              'N/A'}
                          </td>

                          <td>
                            {[
                              franchisee.city_municipality,
                              franchisee.province,
                            ]
                              .filter(Boolean)
                              .join(', ') ||
                              'N/A'}
                          </td>

                          <td>
                            <button
                              type="button"
                              className="user-management-edit-button"
                              onClick={() =>
                                openFranchiseeEditor(
                                  franchisee
                                )
                              }
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      )
                    )
                  )}
                </tbody>
              </table>
            )}
          </section>

          {selectedFranchisee && (
            <form
              className="concern-form user-management-form user-management-editor-card"
              onSubmit={
                handleUpdateFranchisee
              }
            >
              <h2>
                Franchisee 360 Profile
              </h2>

              <div
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '14px',
                  padding: '18px',
                  marginBottom: '22px',
                  background: '#ffffff',
                  boxShadow:
                    '0 4px 14px rgba(0, 0, 0, 0.06)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent:
                      'space-between',
                    alignItems: 'flex-start',
                    gap: '16px',
                    flexWrap: 'wrap',
                    marginBottom: '16px',
                  }}
                >
                  <div>
                    <h3
                      style={{
                        margin: '0 0 4px',
                      }}
                    >
                      {
                        selectedFranchisee.full_name
                      }
                    </h3>

                    <p
                      style={{
                        margin: 0,
                        color: '#6b7280',
                      }}
                    >
                      {
                        selectedFranchisee.email ||
                        'No email available'
                      }
                    </p>
                  </div>

                  {editForm.marketingMaterialsLink && (
                    <a
                      href={
                        editForm.marketingMaterialsLink
                      }
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        background: '#5b21b6',
                        color: '#ffffff',
                        textDecoration: 'none',
                        fontWeight: 600,
                      }}
                    >
                      📁 Open Marketing Folder
                    </a>
                  )}
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '14px',
                  }}
                >
                  {[
                    [
                      'Store',
                      editForm.storeName || 'N/A',
                    ],
                    [
                      'Package',
                      editForm.franchisePackage || 'N/A',
                    ],
                    [
                      'Concept',
                      editForm.franchiseConcept || 'N/A',
                    ],
                    [
                      'Marketing Consultant',
                      editForm.marketingConsultant ||
                        'N/A',
                    ],
                    [
                      'Location',
                      [
                        editForm.cityMunicipality,
                        editForm.province,
                      ]
                        .filter(Boolean)
                        .join(', ') || 'N/A',
                    ],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      style={{
                        padding: '12px',
                        borderRadius: '10px',
                        background: '#f8fafc',
                      }}
                    >
                      <small
                        style={{
                          display: 'block',
                          color: '#6b7280',
                          marginBottom: '4px',
                        }}
                      >
                        {label}
                      </small>

                      <strong>{value}</strong>
                    </div>
                  ))}
                </div>
              </div>

              <h3>
                Edit Franchise Information
              </h3>

              {renderFranchiseFields(
                editForm,
                updateEditForm,
                isUpdating
              )}

              <div
                style={{
                  display: 'flex',
                  gap: '10px',
                  flexWrap: 'wrap',
                }}
              >
                <button
                  type="submit"
                  disabled={isUpdating}
                >
                  {isUpdating
                    ? 'Saving Changes...'
                    : 'Save Changes'}
                </button>

                <button
                  type="button"
                  className="back-button"
                  onClick={() => {
                    setSelectedFranchisee(
                      null
                    )
                    setEditForm(
                      emptyFranchiseForm
                    )
                  }}
                  disabled={isUpdating}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </>
      ) : (
        <div className="error-message">
          You do not have permission
          to create portal accounts.
        </div>
      )}

    </div>
  )
}

export default UserManagement