import { useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

const sampleData = [
  { day: "Mon", tickets: 12 },
  { day: "Tue", tickets: 18 },
  { day: "Wed", tickets: 10 },
  { day: "Thu", tickets: 22 },
  { day: "Fri", tickets: 28 },
  { day: "Sat", tickets: 17 },
  { day: "Sun", tickets: 8 },
];

export default function TicketTrendChart({
  tickets = [],
}) {

  const chartData = useMemo(() => {

    if (!tickets.length) {
      return sampleData;
    }

    const days = {
      Sun: 0,
      Mon: 0,
      Tue: 0,
      Wed: 0,
      Thu: 0,
      Fri: 0,
      Sat: 0,
    };

    tickets.forEach((ticket) => {

      if (!ticket.created_at) return;

      const day = new Date(ticket.created_at).toLocaleDateString(
        "en-US",
        { weekday: "short" }
      );

      if (days[day] !== undefined) {
        days[day]++;
      }

    });

    return Object.entries(days).map(([day, count]) => ({
      day,
      tickets: count,
    }));

  }, [tickets]);

  return (
    <section className="report-card report-section">

      <div className="section-header">

        <div>

          <span className="section-eyebrow">
            BUSINESS INTELLIGENCE
          </span>

          <h2>
            Customer Service Ticket Volume
          </h2>

          <p>
            Daily customer service ticket activity.
          </p>

        </div>

      </div>

      <ResponsiveContainer
        width="100%"
        height={340}
      >

        <LineChart
          data={chartData}
          margin={{
            top: 10,
            right: 20,
            left: 0,
            bottom: 5,
          }}
        >

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#ECE7F3"
          />

          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
          />

          <YAxis
            allowDecimals={false}
            axisLine={false}
            tickLine={false}
          />

          <Tooltip />

          <Line
            type="monotone"
            dataKey="tickets"
            stroke="#6B35A3"
            strokeWidth={4}
            dot={{
              r: 5,
            }}
          />

        </LineChart>

      </ResponsiveContainer>

    </section>
  );
}