import { useMemo, useState } from 'react'
import {
  buildExecutiveReport,
  downloadReportCsv,
} from '../services/reports/ReportService'
import './ExecutiveReports.css'
import TicketTrendChart from '../components/dashboard/TicketTrendChart'

const PERIOD_OPTIONS = [
  {
    value: 'daily',
    label: 'Daily',
    description: 'Today only',
  },
  {
    value: 'weekly',
    label: 'Weekly',
    description: 'Last 7 days',
  },
  {
    value: 'monthly',
    label: 'Monthly',
    description: 'Current month',
  },
]

function ReportMetricCard({
  icon,
  label,
  value,
  detail,
  attention = false,
}) {
  return (
    <article
      className={`report-metric-card ${
        attention ? 'report-metric-card-attention' : ''
      }`}
    >
      <div className="report-metric-icon">
        {icon}
      </div>

      <div className="report-metric-copy">
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{detail}</small>
      </div>
    </article>
  )
}

function InsightCard({
  eyebrow,
  title,
  value,
  description,
}) {
  return (
    <article className="report-insight-card">
      <span className="report-card-eyebrow">
        {eyebrow}
      </span>

      <h3>{title}</h3>

      <strong>{value}</strong>

      <p>{description}</p>
    </article>
  )
}

function buildExecutiveAlerts({
  report,
  urgentOpenTickets,
  slaComplianceRate,
  unassignedOlderThan24Hours,
}) {
  const alerts = []

  alerts.push({
    tone:
      report.overdueTickets > 0
        ? 'danger'
        : 'success',
    icon:
      report.overdueTickets > 0
        ? '🚨'
        : '✅',
    title:
      report.overdueTickets > 0
        ? 'Overdue Tickets'
        : 'SLA Status',
    message:
      report.overdueTickets > 0
        ? `${report.overdueTickets} overdue ticket${
            report.overdueTickets === 1
              ? ''
              : 's'
          } require immediate follow-up.`
        : 'No overdue tickets were recorded for the selected period.',
  })

  alerts.push({
    tone:
      slaComplianceRate >= 90
        ? 'success'
        : slaComplianceRate >= 80
        ? 'warning'
        : 'danger',
    icon:
      slaComplianceRate >= 90
        ? '🎯'
        : '⚠️',
    title: 'SLA Compliance',
    message:
      slaComplianceRate >= 90
        ? `SLA compliance is healthy at ${slaComplianceRate}%.`
        : `SLA compliance is currently ${slaComplianceRate}% and may need attention.`,
  })

  alerts.push({
    tone:
      urgentOpenTickets > 0
        ? 'danger'
        : 'success',
    icon:
      urgentOpenTickets > 0
        ? '🔥'
        : '🟢',
    title: 'Urgent Ticket Status',
    message:
      urgentOpenTickets > 0
        ? `${urgentOpenTickets} unresolved urgent ticket${
            urgentOpenTickets === 1
              ? ''
              : 's'
          } require priority handling.`
        : 'There are no unresolved urgent tickets.',
  })

  alerts.push({
    tone:
      unassignedOlderThan24Hours > 0
        ? 'warning'
        : 'success',
    icon:
      unassignedOlderThan24Hours > 0
        ? '⏳'
        : '✓',
    title: 'Unassigned Tickets',
    message:
      unassignedOlderThan24Hours > 0
        ? `${unassignedOlderThan24Hours} ticket${
            unassignedOlderThan24Hours === 1
              ? ' has'
              : 's have'
          } remained unassigned for more than 24 hours.`
        : 'No ticket has remained unassigned for more than 24 hours.',
  })

  return alerts
}

function ExecutiveReports({
  tickets = [],
  dashboardMetrics = {},
  onBack,
}) {
  const [period, setPeriod] =
    useState('monthly')

  const report = useMemo(
    () =>
      buildExecutiveReport({
        tickets,
        dashboardMetrics,
        period,
      }),
    [tickets, dashboardMetrics, period]
  )

  const selectedPeriod =
    PERIOD_OPTIONS.find(
      (option) => option.value === period
    ) || PERIOD_OPTIONS[2]

  const now = report.generatedAt

  const reportTickets =
    report.tickets || []

  const isClosedTicket = (ticket) =>
    ticket.status === 'Resolved' ||
    ticket.status === 'Closed'

  const urgentOpenTickets =
    reportTickets.filter(
      (ticket) =>
        ticket.priority === 'Urgent' &&
        !isClosedTicket(ticket)
    ).length

  const slaTrackedTickets =
    reportTickets.filter(
      (ticket) =>
        ticket.priority_locked === true &&
        ticket.sla_due_at
    )

  const slaCompliantTickets =
    slaTrackedTickets.filter(
      (ticket) =>
        isClosedTicket(ticket) ||
        new Date(
          ticket.sla_due_at
        ).getTime() >= now.getTime()
    ).length

  const slaComplianceRate =
    slaTrackedTickets.length > 0
      ? Math.round(
          (slaCompliantTickets /
            slaTrackedTickets.length) *
            100
        )
      : 100

  const responseTimesInMinutes =
    reportTickets
      .map((ticket) => {
        if (
          !ticket.created_at ||
          !ticket.first_response_at
        ) {
          return null
        }

        const createdAt =
          new Date(
            ticket.created_at
          ).getTime()

        const firstResponseAt =
          new Date(
            ticket.first_response_at
          ).getTime()

        const difference =
          firstResponseAt -
          createdAt

        return difference >= 0
          ? difference / 60000
          : null
      })
      .filter(
        (minutes) =>
          Number.isFinite(minutes)
      )

  const averageFirstResponseMinutes =
    responseTimesInMinutes.length > 0
      ? Math.round(
          responseTimesInMinutes.reduce(
            (total, minutes) =>
              total + minutes,
            0
          ) /
            responseTimesInMinutes.length
        )
      : null

  const averageFirstResponseLabel =
    averageFirstResponseMinutes === null
      ? 'N/A'
      : averageFirstResponseMinutes < 60
      ? `${averageFirstResponseMinutes} min`
      : `${(
          averageFirstResponseMinutes /
          60
        ).toFixed(1)} hr`

  const unassignedOlderThan24Hours =
    reportTickets.filter(
      (ticket) => {
        if (
          ticket.assigned_to ||
          isClosedTicket(ticket) ||
          !ticket.created_at
        ) {
          return false
        }

        return (
          now.getTime() -
            new Date(
              ticket.created_at
            ).getTime() >
          24 * 60 * 60 * 1000
        )
      }
    ).length

  const executiveAlerts =
    buildExecutiveAlerts({
      report,
      urgentOpenTickets,
      slaComplianceRate,
      unassignedOlderThan24Hours,
    })

  return (
    <div className="executive-reports-page">
      <div className="executive-reports-shell">
        <section className="reports-hero no-print">
          <div className="reports-hero-copy">
            <span className="reports-eyebrow">
              Business Intelligence Dashboard
            </span>

            <h1>Executive Command Center</h1>

            <p>
              Real-time executive insights for MLSN Franchising Solution Corporation.
            </p>
          </div>

          <button
            type="button"
            className="reports-back-button"
            onClick={onBack}
          >
            ← Back to Dashboard
          </button>
        </section>

        <section className="reports-toolbar no-print">
          <div>
            <span className="toolbar-label">
              Report period
            </span>

            <div className="period-selector">
              {PERIOD_OPTIONS.map(
                (option) => (
                  <button
                    type="button"
                    key={option.value}
                    className={`period-button ${
                      period === option.value
                        ? 'period-button-active'
                        : ''
                    }`}
                    onClick={() =>
                      setPeriod(option.value)
                    }
                  >
                    <strong>{option.label}</strong>
                    <small>
                      {option.description}
                    </small>
                  </button>
                )
              )}
            </div>
          </div>

          <div className="reports-actions">
            <button
              type="button"
              className="reports-secondary-button"
              onClick={() =>
                downloadReportCsv(report)
              }
            >
              Export CSV
            </button>

            <button
              type="button"
              className="reports-primary-button"
              onClick={() => window.print()}
            >
              Print / Save PDF
            </button>
          </div>
        </section>

        <section className="report-status-strip no-print">
          <div>
            <span className="report-status-dot report-status-good"></span>
            <strong>System Status</strong>
            <small>Operational</small>
          </div>

          <div>
            <span className={`report-status-dot ${
              report.overdueTickets > 0
                ? 'report-status-danger'
                : 'report-status-good'
            }`}></span>
            <strong>Customer Service</strong>
            <small>
              {report.overdueTickets > 0
                ? 'Needs Attention'
                : 'Healthy'}
            </small>
          </div>

          <div>
            <span className={`report-status-dot ${
              slaComplianceRate >= 90
                ? 'report-status-good'
                : slaComplianceRate >= 80
                ? 'report-status-warning'
                : 'report-status-danger'
            }`}></span>
            <strong>SLA</strong>
            <small>{slaComplianceRate}%</small>
          </div>

          <div>
            <span className="report-status-dot report-status-info"></span>
            <strong>Last Updated</strong>
            <small>
              {report.generatedAt.toLocaleTimeString(
                'en-PH',
                {
                  hour: 'numeric',
                  minute: '2-digit',
                }
              )}
            </small>
          </div>
        </section>

        <main className="reports-content">
          <header className="report-document-header">
            <div>
              <span className="report-document-eyebrow">
                MLSN Franchising Solution
                Corporation
              </span>

              <h2>
                Customer Service Executive Report
              </h2>

              <p>
                {selectedPeriod.label} operations
                summary
              </p>

              <div className="executive-summary-box">
                <div className="summary-item">
                  <span>🟢</span>
                  <div>
                    <strong>Customer Service Status</strong>
                    <p>{report.overdueTickets > 0 ? 'Needs attention due to overdue tickets.' : 'Operating normally.'}</p>
                  </div>
                </div>

                <div className="summary-item">
                  <span>⚡</span>
                  <div>
                    <strong>SLA Compliance</strong>
                    <p>{slaComplianceRate}% SLA compliance.</p>
                  </div>
                </div>

                <div className="summary-item">
                  <span>🎫</span>
                  <div>
                    <strong>Open Tickets</strong>
                    <p>{report.openTickets} currently require action.</p>
                  </div>
                </div>

                <div className="summary-item">
                  <span>🔥</span>
                  <div>
                    <strong>Urgent Tickets</strong>
                    <p>{urgentOpenTickets} urgent ticket(s).</p>
                  </div>
                </div>

                <div className="summary-item">
                  <span>✅</span>
                  <div>
                    <strong>Overdue Tickets</strong>
                    <p>{report.overdueTickets === 0 ? 'No overdue tickets.' : `${report.overdueTickets} overdue ticket(s).`}</p>
                  </div>
                </div>

                <div className="summary-item">
                  <span>📅</span>
                  <div>
                    <strong>Report Generated</strong>
                    <p>{report.generatedAt.toLocaleDateString('en-PH')}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="report-generated-card">
              <div>
                <span>Generated</span>
                <strong>
                  {report.generatedAt.toLocaleDateString(
                    'en-PH',
                    {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    }
                  )}
                </strong>
                <small>
                  {report.generatedAt.toLocaleTimeString(
                    'en-PH',
                    {
                      hour: 'numeric',
                      minute: '2-digit',
                    }
                  )}
                </small>
              </div>

              <div className="report-generated-meta">
                <span>Prepared By</span>
                <strong>
                  MLSN Executive Reports
                </strong>
              </div>

              <span className="report-live-badge">
                ● Live Data
              </span>
            </div>
          </header>

          <section className="report-section-heading">
            <div>
              <span className="report-section-eyebrow">
                Customer service health
              </span>
              <h2>Performance Overview</h2>
            </div>

            <p>
              Live customer service indicators for the selected report period.
            </p>
          </section>

          <section className="report-metrics-grid report-health-grid">
            <ReportMetricCard
              icon="🎫"
              label="Total Tickets"
              value={report.totalTickets}
              detail={`${selectedPeriod.label} ticket volume`}
            />

            <ReportMetricCard
              icon="📂"
              label="Open Tickets"
              value={report.openTickets}
              detail="Currently requiring action"
            />

            <ReportMetricCard
              icon="✅"
              label="Resolved Tickets"
              value={report.resolvedTickets}
              detail={`${report.resolutionRate}% resolution rate`}
            />

            <ReportMetricCard
              icon="⚠️"
              label="Overdue Tickets"
              value={report.overdueTickets}
              detail="Past the assigned SLA"
              attention={
                report.overdueTickets > 0
              }
            />

            <ReportMetricCard
              icon="📈"
              label="Resolution Rate"
              value={`${report.resolutionRate}%`}
              detail="Resolved within the selected period"
              attention={
                report.resolutionRate < 80
              }
            />

            <ReportMetricCard
              icon="🎯"
              label="SLA Compliance"
              value={`${slaComplianceRate}%`}
              detail={`${slaTrackedTickets.length} SLA-tracked ticket${
                slaTrackedTickets.length === 1
                  ? ''
                  : 's'
              }`}
              attention={
                slaComplianceRate < 90
              }
            />

            <ReportMetricCard
              icon="⏱️"
              label="Avg. First Response"
              value={averageFirstResponseLabel}
              detail={
                averageFirstResponseMinutes === null
                  ? 'Available once first-response timestamps are recorded'
                  : 'Average time before the first CS response'
              }
            />

            <ReportMetricCard
              icon="🔥"
              label="Urgent Open"
              value={urgentOpenTickets}
              detail="Unresolved urgent-priority tickets"
              attention={
                urgentOpenTickets > 0
              }
            />
          </section>

          <section className="report-insights-grid">
            <InsightCard
              eyebrow="Franchise package"
              title="🏆 Leading Package"
              value={
                report.leadingPackage?.name ||
                'No package data'
              }
              description={
                report.leadingPackage
                  ? `${report.leadingPackage.value} franchise record${
                      report.leadingPackage.value === 1
                        ? ''
                        : 's'
                    }`
                  : 'Package distribution will appear once franchise records are available.'
              }
            />

            <InsightCard
              eyebrow="Regional footprint"
              title="📍 Most Active Region"
              value={
                report.leadingRegion?.name ||
                'No regional data'
              }
              description={
                report.leadingRegion
                  ? `${report.leadingRegion.value} franchise record${
                      report.leadingRegion.value === 1
                        ? ''
                        : 's'
                    }`
                  : 'Regional distribution will appear once location records are available.'
              }
            />
          </section>

          {/* =========================================
    LIVE COMPANY ACTIVITY
========================================= */}

          <section className="report-table-section">
            <div className="report-section-heading">
              <div>
                <span className="report-section-eyebrow">
                  Operational details
                </span>
                <h2>Ticket Details</h2>
              </div>

              <div className="report-table-summary">
                <span>Total Tickets</span>
                <strong>{report.tickets.length}</strong>
                <small>
                  Showing {report.tickets.length} of {report.tickets.length}
                </small>
              </div>
            </div>

            <div className="report-table-wrap">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Ticket No.</th>
                    <th>Franchisee</th>
                    <th>Category</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Assigned To</th>
                    <th>Date</th>
                  </tr>
                </thead>

                <tbody>
                  {report.tickets.length === 0 ? (
                    <tr>
                      <td
                        colSpan="7"
                        className="report-empty-state"
                      >
                        No tickets found for this
                        report period.
                      </td>
                    </tr>
                  ) : (
                    report.tickets.map(
                      (ticket) => (
                        <tr key={ticket.id}>
                          <td>
                            {ticket.ticket_number ||
                              'N/A'}
                          </td>
                          <td>
                            {ticket.franchisee_name ||
                              'N/A'}
                          </td>
                          <td>
                            {ticket.category ||
                              'N/A'}
                          </td>
                          <td>
                            <span className="report-table-badge">
                              {ticket.priority ||
                                'Not Set'}
                            </span>
                          </td>
                          <td>
                            {ticket.status ||
                              'N/A'}
                          </td>
                          <td>
                            {ticket.assigned_agent_name ||
                              'Unassigned'}
                          </td>
                          <td>
                            {ticket.created_at
                              ? new Date(
                                  ticket.created_at
                                ).toLocaleDateString(
                                  'en-PH'
                                )
                              : 'N/A'}
                          </td>
                        </tr>
                      )
                    )
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <footer className="report-footer report-footer-official">
            <span>
              Prepared by MLSN Executive Reports
            </span>
            <span>
              Generated automatically through the MLSN Customer Service Portal
            </span>
            <strong>Confidential</strong>
          </footer>
        </main>
      </div>
    </div>
  )
}

export default ExecutiveReports