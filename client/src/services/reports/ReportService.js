function escapeCsvValue(value) {
  const text = String(value ?? '')

  if (
    text.includes(',') ||
    text.includes('"') ||
    text.includes('\n')
  ) {
    return `"${text.replace(/"/g, '""')}"`
  }

  return text
}

function getDateRange(period) {
  const now = new Date()
  const end = new Date(now)
  end.setHours(23, 59, 59, 999)

  const start = new Date(now)
  start.setHours(0, 0, 0, 0)

  if (period === 'weekly') {
    start.setDate(start.getDate() - 6)
  } else if (period === 'monthly') {
    start.setDate(1)
  }

  return { start, end }
}

export function filterTicketsByPeriod(
  tickets = [],
  period = 'monthly'
) {
  const { start, end } = getDateRange(period)

  return tickets.filter((ticket) => {
    if (!ticket.created_at) return false

    const createdAt = new Date(ticket.created_at)

    return (
      !Number.isNaN(createdAt.getTime()) &&
      createdAt >= start &&
      createdAt <= end
    )
  })
}

export function buildExecutiveReport({
  tickets = [],
  dashboardMetrics = {},
  period = 'monthly',
}) {
  const filteredTickets =
    filterTicketsByPeriod(tickets, period)

  const resolvedTickets = filteredTickets.filter(
    (ticket) =>
      ticket.status === 'Resolved' ||
      ticket.status === 'Closed'
  )

  const openTickets = filteredTickets.filter(
    (ticket) =>
      ticket.status !== 'Resolved' &&
      ticket.status !== 'Closed'
  )

  const overdueTickets = openTickets.filter(
    (ticket) => {
      if (
        !ticket.priority_locked ||
        !ticket.sla_due_at
      ) {
        return false
      }

      const dueAt = new Date(ticket.sla_due_at)

      return (
        !Number.isNaN(dueAt.getTime()) &&
        dueAt.getTime() < Date.now()
      )
    }
  )

  const resolutionRate =
    filteredTickets.length > 0
      ? Math.round(
          (resolvedTickets.length /
            filteredTickets.length) *
            100
        )
      : 0

  return {
    period,
    generatedAt: new Date(),
    totalTickets: filteredTickets.length,
    openTickets: openTickets.length,
    resolvedTickets: resolvedTickets.length,
    overdueTickets: overdueTickets.length,
    resolutionRate,
    totalFranchisees:
      dashboardMetrics.franchisees || 0,
    newFranchiseesThisMonth:
      dashboardMetrics.newFranchiseesThisMonth || 0,
    leadingPackage:
      dashboardMetrics.packageDistribution?.[0] ||
      null,
    leadingRegion:
      dashboardMetrics.regionDistribution?.[0] ||
      null,
    tickets: filteredTickets,
  }
}

export function downloadReportCsv(report) {
  const rows = [
    ['MLSN Customer Service Executive Report'],
    ['Period', report.period],
    [
      'Generated',
      report.generatedAt.toLocaleString('en-PH'),
    ],
    [],
    ['Executive Summary'],
    ['Total Tickets', report.totalTickets],
    ['Open Tickets', report.openTickets],
    ['Resolved Tickets', report.resolvedTickets],
    ['Overdue Tickets', report.overdueTickets],
    ['Resolution Rate', `${report.resolutionRate}%`],
    ['Total Franchisees', report.totalFranchisees],
    [
      'New Franchisees This Month',
      report.newFranchiseesThisMonth,
    ],
    [
      'Leading Package',
      report.leadingPackage?.name || 'No data',
    ],
    [
      'Most Active Region',
      report.leadingRegion?.name || 'No data',
    ],
    [],
    ['Ticket Details'],
    [
      'Ticket No.',
      'Franchisee',
      'Category',
      'Subject',
      'Priority',
      'Status',
      'Assigned To',
      'Date Submitted',
    ],
    ...report.tickets.map((ticket) => [
      ticket.ticket_number || '',
      ticket.franchisee_name || '',
      ticket.category || '',
      ticket.subject || '',
      ticket.priority || '',
      ticket.status || '',
      ticket.assigned_agent_name || 'Unassigned',
      ticket.created_at
        ? new Date(
            ticket.created_at
          ).toLocaleString('en-PH')
        : '',
    ]),
  ]

  const csv = rows
    .map((row) =>
      row.map(escapeCsvValue).join(',')
    )
    .join('\n')

  const blob = new Blob([csv], {
    type: 'text/csv;charset=utf-8;',
  })

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download =
    `MLSN-CS-${report.period}-report.csv`

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
