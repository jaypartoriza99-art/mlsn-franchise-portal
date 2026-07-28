import TicketStatusChart from './charts/TicketStatusChart'
import PackageDistributionChart from './charts/PackageDistributionChart'
import MonthlyGrowthChart from './charts/MonthlyGrowthChart'
import RegionDistributionChart from './charts/RegionDistributionChart'

function ExecutiveAnalyticsSection({
  ticketStatus = [],
  packageDistribution = [],
  monthlyGrowth = [],
  regionDistribution = [],
}) {
  return (
    <section
      style={{
        margin: '18px 0',
        width: '100%',
        minWidth: 0,
      }}
    >
      <div
        style={{
          marginBottom: '10px',
        }}
      >
        <h2
          style={{
            margin: 0,
            color: '#172033',
            fontSize: '14px',
            lineHeight: 1.25,
          }}
        >
          Executive Analytics
        </h2>

        <p
          style={{
            margin: '4px 0 0',
            color: '#667085',
            fontSize: '9px',
            lineHeight: 1.4,
          }}
        >
          A live overview of franchise growth and customer service operations.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(4, minmax(0, 1fr))',
          gap: '10px',
          width: '100%',
          minWidth: 0,
          alignItems: 'stretch',
        }}
      >
        <div style={{ minWidth: 0 }}>
          <TicketStatusChart
            data={ticketStatus}
          />
        </div>

        <div style={{ minWidth: 0 }}>
          <PackageDistributionChart
            data={packageDistribution}
          />
        </div>

        <div style={{ minWidth: 0 }}>
          <MonthlyGrowthChart
            data={monthlyGrowth}
          />
        </div>

        <div style={{ minWidth: 0 }}>
          <RegionDistributionChart
            data={regionDistribution}
          />
        </div>
      </div>
    </section>
  )
}

export default ExecutiveAnalyticsSection