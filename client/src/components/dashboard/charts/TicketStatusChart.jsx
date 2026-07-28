import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  chartCardStyle,
  chartSubtitleStyle,
  chartTitleStyle,
  EmptyChart,
} from './chartShared'

function TicketStatusChart({ data = [] }) {
  const hasData = data.some((item) => item.value > 0)

  return (
    <article style={chartCardStyle}>
      <h3 style={chartTitleStyle}>Ticket Status</h3>
      <p style={chartSubtitleStyle}>
        Current distribution of all franchisee concerns
      </p>

      {!hasData ? (
        <EmptyChart message="No ticket data available yet." />
      ) : (
        <div style={{ width: '100%', height: 245 }}>
          <ResponsiveContainer>
            <BarChart
              data={data}
              margin={{ top: 8, right: 10, left: -18, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip cursor={{ fill: 'rgba(15, 23, 42, 0.04)' }} />
              <Bar
                dataKey="value"
                name="Tickets"
                fill="#5b4df7"
                radius={[8, 8, 0, 0]}
                maxBarSize={52}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </article>
  )
}

export default TicketStatusChart
