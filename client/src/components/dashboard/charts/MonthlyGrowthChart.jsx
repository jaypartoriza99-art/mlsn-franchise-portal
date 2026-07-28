import {
  Area,
  AreaChart,
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

function MonthlyGrowthChart({ data = [] }) {
  const hasData = data.some((item) => item.value > 0)

  return (
    <article style={chartCardStyle}>
      <h3 style={chartTitleStyle}>Monthly Franchise Growth</h3>
      <p style={chartSubtitleStyle}>
        New franchise records during the last six months
      </p>

      {!hasData ? (
        <EmptyChart message="No monthly growth data available yet." />
      ) : (
        <div style={{ width: '100%', height: 245 }}>
          <ResponsiveContainer>
            <AreaChart
              data={data}
              margin={{ top: 8, right: 10, left: -18, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="month"
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
              <Tooltip />
              <Area
                type="monotone"
                dataKey="value"
                name="New Franchisees"
                stroke="#19a974"
                fill="#dff7ed"
                strokeWidth={3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </article>
  )
}

export default MonthlyGrowthChart
