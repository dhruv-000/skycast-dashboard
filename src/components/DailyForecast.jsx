import { motion } from "framer-motion";

export default function DailyForecast({ daily, unit }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.75 }}
      className="glass-card rounded-3xl p-6"
    >
      <h3 className="mb-4 text-lg font-semibold text-white">7 Day Outlook</h3>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {daily.map((day) => (
          <div
            key={day.date}
            className="rounded-2xl border border-white/15 bg-black/20 p-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-white">{day.dayLabel}</p>
              <img
                src={day.condition.icon}
                alt={day.condition.text}
                className="h-9 w-9"
              />
            </div>
            <p className="mt-2 text-xs text-slate-300">{day.condition.text}</p>
            <p className="mt-3 text-sm text-cyan-100">
              H {Math.round(unit === "C" ? day.max.c : day.max.f)}
              {"\u00B0"}
              {unit}
            </p>
            <p className="text-sm text-slate-200">
              L {Math.round(unit === "C" ? day.min.c : day.min.f)}
              {"\u00B0"}
              {unit}
            </p>
            <p className="mt-2 text-xs text-slate-300">{day.chanceOfRain}% precip</p>
          </div>
        ))}
      </div>
    </motion.section>
  );
}
