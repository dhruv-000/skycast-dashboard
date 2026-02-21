import { motion } from "framer-motion";

export default function HourlyForecast({ hourly, unit }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="glass-card rounded-3xl p-6"
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">24 Hour Forecast</h3>
        <p className="text-xs text-slate-300">Scroll horizontally</p>
      </div>

      <div className="forecast-scroll flex gap-3 overflow-x-auto pb-2">
        {hourly.map((entry) => {
          const temp = unit === "C" ? entry.temp.c : entry.temp.f;
          return (
            <div
              key={`${entry.timeEpoch}-${entry.timeLabel}`}
              className="min-w-[110px] rounded-2xl border border-white/15 bg-black/20 p-3 text-center"
            >
              <p className="text-xs text-slate-300">{entry.timeLabel}</p>
              <img
                src={entry.condition.icon}
                alt={entry.condition.text}
                className="mx-auto my-2 h-10 w-10"
              />
              <p className="text-lg font-semibold text-white">
                {Math.round(temp)}
                {"\u00B0"}
                {unit}
              </p>
              <p className="text-xs text-slate-300">{entry.chanceOfRain}% rain</p>
            </div>
          );
        })}
      </div>
    </motion.section>
  );
}
