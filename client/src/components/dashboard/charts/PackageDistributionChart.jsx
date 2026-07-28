import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import {
  chartCardStyle,
  chartSubtitleStyle,
  chartTitleStyle,
  EmptyChart,
} from './chartShared'

const COLORS = ['#5b4df7', '#19a974', '#f5a524', '#ef5da8', '#2f80ed', '#8f5bd7']

function PackageDistributionChart({ data = [] }) {
  const chartData = data.slice(0, 6)
  const hasData = chartData.some((item) => item.value > 0)

  return (
    <article style={chartCardStyle}>
      <h3 style={chartTitleStyle}>Package Distribution</h3>
      <p style={chartSubtitleStyle}>
        Franchisees grouped by selected package
      </p>

      {!hasData ? (
        <EmptyChart message="No package records available yet." />
      ) : (
        <div style={{ width: '100%', height: 245 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="43%"
                innerRadius={52}
                outerRadius={82}
                paddingAngle={3}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`${entry.name}-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                wrapperStyle={{ fontSize: '11px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </article>
  )
}

export default PackageDistributionChart
