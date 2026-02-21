import { motion } from "framer-motion";
import { formatVisibility } from "../utils/formatters";

function MetricTile({ label, value, subValue }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-black/15 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-300">{label}</p>
      <p className="mt-1 text-xl font-semibold text-white">{value}</p>
      {subValue ? <p className="mt-1 text-xs text-slate-300">{subValue}</p> : null}
    </div>
  );
}

export default function MetricsGrid({ weather, unit }) {
  const windRotation = weather.current.wind.degree || 0;

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55 }}
      className="glass-card rounded-3xl p-6"
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Atmosphere</h3>
        <div className="flex items-center gap-2 text-xs text-cyan-100">
          <span>Wind direction</span>
          <span
            className="inline-block text-base transition-transform duration-500"
            style={{ transform: `rotate(${windRotation}deg)` }}
          >
            ^
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <MetricTile label="Humidity" value={`${weather.current.humidity}%`} />
        <MetricTile
          label="Visibility"
          value={formatVisibility(weather.current.visibility, unit)}
        />
        <MetricTile label="UV Index" value={weather.current.uv ?? "N/A"} />
        <MetricTile
          label="Feels Like"
          value={`${Math.round(unit === "C" ? weather.current.feelsLike.c : weather.current.feelsLike.f)}\u00B0${unit}`}
        />
        <MetricTile
          label="Lat / Lon"
          value={`${weather.location.lat.toFixed(2)}, ${weather.location.lon.toFixed(2)}`}
        />
        <MetricTile
          label="Condition"
          value={weather.current.condition.text}
          subValue={weather.current.isDay ? "Day mode" : "Night mode"}
        />
      </div>
    </motion.section>
  );
}
