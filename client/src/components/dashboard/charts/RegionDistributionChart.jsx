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

function RegionDistributionChart({ data = [] }) {
  const chartData = data.slice(0, 7)
  const hasData = chartData.some((item) => item.value > 0)

  return (
    <article style={chartCardStyle}>
      <h3 style={chartTitleStyle}>Franchisees by Region</h3>
      <p style={chartSubtitleStyle}>
        Leading geographic areas based on franchise records
      </p>

      {!hasData ? (
        <EmptyChart message="No regional records available yet." />
      ) : (
        <div style={{ width: '100%', height: 245 }}>
          <ResponsiveContainer>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 4, right: 16, left: 18, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis
                type="number"
                allowDecimals={false}
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={90}
                tick={{ fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip />
              <Bar
                dataKey="value"
                name="Franchisees"
                fill="#f5a524"
                radius={[0, 8, 8, 0]}
                maxBarSize={24}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </article>
  )
}

export default RegionDistributionChart
