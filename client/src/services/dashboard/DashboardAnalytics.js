import { supabase } from '../../lib/supabase'
import { CUSTOMER_SERVICE_CATEGORIES } from '../../config/customerServiceCategories'

function normalizeLabel(value, fallback = 'Unspecified') {
  const label = String(value || '').trim()
  return label || fallback
}

function countBy(items, getKey) {
  const counts = new Map()

  items.forEach((item) => {
    const key = normalizeLabel(getKey(item))
    counts.set(key, (counts.get(key) || 0) + 1)
  })

  return [...counts.entries()]
    .map(([name, value]) => ({
      name,
      value,
    }))
    .sort((a, b) => b.value - a.value)
}

function getMonthStart(date = new Date()) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    1,
    0,
    0,
    0,
    0
  )
}

function getRecentMonthRanges(monthCount = 6) {
  const ranges = []
  const now = new Date()

  for (
    let index = monthCount - 1;
    index >= 0;
    index -= 1
  ) {
    const start = new Date(
      now.getFullYear(),
      now.getMonth() - index,
      1,
      0,
      0,
      0,
      0
    )

    const end = new Date(
      now.getFullYear(),
      now.getMonth() - index + 1,
      1,
      0,
      0,
      0,
      0
    )

    ranges.push({
      label: start.toLocaleDateString('en-PH', {
        month: 'short',
        year: 'numeric',
      }),
      start: start.toISOString(),
      end: end.toISOString(),
    })
  }

  return ranges
}

function getFranchiseeDate(franchisee) {
  const rawDate =
    franchisee.franchise_date ||
    franchisee.created_at

  if (!rawDate) {
    return null
  }

  const date = new Date(rawDate)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date
}

function isCustomerServiceCategory(category) {
  const normalizedCategory = String(category || '')
    .trim()
    .toLowerCase()

  return CUSTOMER_SERVICE_CATEGORIES.some(
    (allowedCategory) =>
      allowedCategory.toLowerCase() ===
      normalizedCategory
  )
}

export function buildTicketAnalytics(
  tickets = [],
  now = new Date()
) {
  const isOpen = (ticket) =>
    ticket.status !== 'Resolved' &&
    ticket.status !== 'Closed'

  const isOverdue = (ticket) => {
    if (
      !isOpen(ticket) ||
      !ticket.priority_locked ||
      !ticket.sla_due_at
    ) {
      return false
    }

    const dueAt = new Date(ticket.sla_due_at)

    return (
      !Number.isNaN(dueAt.getTime()) &&
      dueAt.getTime() < now.getTime()
    )
  }

  const customerServiceTickets = tickets.filter(
    (ticket) =>
      isCustomerServiceCategory(ticket.category)
  )

  return {
    totalTickets: tickets.length,

    openTickets: tickets.filter(isOpen).length,

    overdueTickets:
      tickets.filter(isOverdue).length,

    statusDistribution: [
      {
        name: 'Submitted',
        value: tickets.filter(
          (ticket) =>
            ticket.status === 'Submitted'
        ).length,
      },
      {
        name: 'In Progress',
        value: tickets.filter(
          (ticket) =>
            ticket.status === 'In Progress'
        ).length,
      },
      {
        name: 'Waiting',
        value: tickets.filter(
          (ticket) =>
            ticket.status ===
            'Waiting for Franchisee'
        ).length,
      },
      {
        name: 'Resolved',
        value: tickets.filter(
          (ticket) =>
            ticket.status === 'Resolved' ||
            ticket.status === 'Closed'
        ).length,
      },
    ],

    categoryDistribution: countBy(
      customerServiceTickets,
      (ticket) => ticket.category
    ),

    priorityDistribution: countBy(
      tickets.filter(isOpen),
      (ticket) =>
        ticket.priority || 'Not Set'
    ),
  }
}

export async function fetchDashboardAnalytics() {
  const startOfMonth = getMonthStart(new Date())
  const monthRanges = getRecentMonthRanges(6)

  const monthlyCountQueries = monthRanges.map(
    ({ start, end }) =>
      supabase
        .from('franchisees')
        .select('*', {
          count: 'exact',
          head: true,
        })
        .gte('created_at', start)
        .lt('created_at', end)
  )

  const [
    franchiseeCountResult,
    conceptCountResult,
    packageTypeCountResult,
    newFranchiseeCountResult,
    franchiseeRowsResult,
    monthlyCountResults,
  ] = await Promise.all([
    supabase
      .from('franchisees')
      .select('*', {
        count: 'exact',
        head: true,
      }),

    supabase
      .from('franchise_concepts')
      .select('*', {
        count: 'exact',
        head: true,
      }),

    supabase
      .from('franchise_package_types')
      .select('*', {
        count: 'exact',
        head: true,
      }),

    supabase
      .from('franchisees')
      .select('*', {
        count: 'exact',
        head: true,
      })
      .gte(
        'created_at',
        startOfMonth.toISOString()
      ),

    supabase
      .from('franchisees')
      .select('*')
      .order('created_at', {
        ascending: false,
      }),

    Promise.all(monthlyCountQueries),
  ])

  const monthlyError =
    monthlyCountResults.find(
      (result) => result.error
    )?.error

  const error =
    franchiseeCountResult.error ||
    conceptCountResult.error ||
    packageTypeCountResult.error ||
    newFranchiseeCountResult.error ||
    franchiseeRowsResult.error ||
    monthlyError

  if (error) {
    throw error
  }

  const franchisees =
    franchiseeRowsResult.data || []

  const monthlyGrowth = monthRanges.map(
    ({ label }, index) => ({
      month: label,
      value: Number(
        monthlyCountResults[index]?.count || 0
      ),
    })
  )

  return {
    franchisees:
      franchiseeCountResult.count || 0,

    concepts:
      conceptCountResult.count || 0,

    packageTypes:
      packageTypeCountResult.count || 0,

    newFranchiseesThisMonth:
      newFranchiseeCountResult.count || 0,

    packageDistribution: countBy(
      franchisees,
      (franchisee) =>
        franchisee.franchise_package
    ),

    conceptDistribution: countBy(
      franchisees,
      (franchisee) =>
        franchisee.franchise_concept
    ),

    regionDistribution: countBy(
      franchisees,
      (franchisee) =>
        franchisee.region
    ),

    monthlyGrowth,

    recentFranchisees: franchisees
      .slice(0, 5)
      .map((franchisee) => ({
        id: franchisee.id,

        storeName:
          franchisee.store_name ||
          'Unnamed Store',

        packageName:
          franchisee.franchise_package ||
          'No package',

        conceptName:
          franchisee.franchise_concept ||
          'No concept',

        location: [
          franchisee.city_municipality,
          franchisee.province,
          franchisee.region,
        ]
          .filter(Boolean)
          .join(', '),

        franchiseDate:
          franchisee.franchise_date ||
          franchisee.created_at,
      })),
  }
}