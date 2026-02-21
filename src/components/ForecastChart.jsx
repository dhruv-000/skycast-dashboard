import { motion } from "framer-motion";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function ForecastChart({ hourly, unit }) {
  const chartData = hourly.map((entry) => ({
    time: entry.timeLabel,
    temp: unit === "C" ? entry.temp.c : entry.temp.f,
    rain: entry.chanceOfRain,
  }));

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
      className="glass-card rounded-3xl p-6"
    >
      <h3 className="mb-4 text-lg font-semibold text-white">Temperature Trend</h3>
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 24, left: -12, bottom: 8 }}>
            <CartesianGrid strokeDasharray="4 4" stroke="rgba(226,232,240,0.16)" />
            <XAxis dataKey="time" stroke="#dbeafe" tick={{ fontSize: 12 }} />
            <YAxis
              yAxisId="temp"
              stroke="#dbeafe"
              tick={{ fontSize: 12 }}
              unit={`\u00B0${unit}`}
              width={44}
            />
            <YAxis
              yAxisId="rain"
              orientation="right"
              stroke="#ddd6fe"
              tick={{ fontSize: 12 }}
              unit="%"
              width={36}
            />
            <Tooltip
              formatter={(value, key) =>
                key === "temp"
                  ? `${Number(value).toFixed(1)}\u00B0${unit}`
                  : `${value}%`
              }
              contentStyle={{
                backgroundColor: "rgba(15, 23, 42, 0.94)",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.2)",
              }}
            />
            <Line
              type="monotone"
              dataKey="temp"
              yAxisId="temp"
              stroke="#67e8f9"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 5, fill: "#a5f3fc" }}
            />
            <Line
              type="monotone"
              dataKey="rain"
              yAxisId="rain"
              stroke="#c084fc"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.section>
  );
}
