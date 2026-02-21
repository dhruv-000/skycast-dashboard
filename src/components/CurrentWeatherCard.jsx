import { motion } from "framer-motion";
import AnimatedNumber from "./AnimatedNumber";
import {
  formatFeelsLikeDiff,
  formatSpeed,
  formatTemperature,
} from "../utils/formatters";

export default function CurrentWeatherCard({
  weather,
  unit,
  isFavorite,
  onToggleFavorite,
}) {
  const currentTemp = unit === "C" ? weather.current.temp.c : weather.current.temp.f;
  const feelsLikeTemp =
    unit === "C" ? weather.current.feelsLike.c : weather.current.feelsLike.f;
  const tempGapLabel = formatFeelsLikeDiff(currentTemp, feelsLikeTemp);

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="glass-card flex h-full flex-col gap-5 rounded-3xl p-6"
    >
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-cyan-100/85">Now in</p>
          <h2 className="text-2xl font-bold text-white">
            {weather.location.name}
            {weather.location.region ? `, ${weather.location.region}` : ""}
          </h2>
          <p className="text-sm text-slate-200">{weather.location.country}</p>
          <p className="mt-1 text-xs text-slate-300">{weather.location.localTimeLabel}</p>
        </div>
        <button
          type="button"
          onClick={onToggleFavorite}
          className="rounded-xl border border-white/20 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/15"
        >
          {isFavorite ? "Saved" : "Save"}
        </button>
      </header>

      <div className="flex items-center justify-between gap-4">
        <div>
          <AnimatedNumber
            value={currentTemp}
            decimals={1}
            suffix={`\u00B0${unit}`}
            className="text-5xl font-bold tracking-tight text-white"
          />
          <p className="mt-2 text-sm text-cyan-100">{weather.current.condition.text}</p>
          <p className="mt-1 text-xs text-slate-300">
            Feels like {formatTemperature(weather.current.feelsLike, unit)}
          </p>
          <p className="mt-1 text-xs text-slate-300">{tempGapLabel}</p>
        </div>
        <motion.img
          key={weather.current.condition.icon}
          src={weather.current.condition.icon}
          alt={weather.current.condition.text}
          className="h-20 w-20 drop-shadow-[0_8px_20px_rgba(10,80,120,0.45)]"
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm text-slate-100">
        <div className="rounded-2xl bg-black/15 px-3 py-2">
          <p className="text-xs uppercase tracking-wide text-slate-300">Wind</p>
          <p className="mt-1 font-semibold">
            {formatSpeed(weather.current.wind, unit)} {weather.current.wind.direction}
          </p>
        </div>
        <div className="rounded-2xl bg-black/15 px-3 py-2">
          <p className="text-xs uppercase tracking-wide text-slate-300">Pressure</p>
          <p className="mt-1 font-semibold">{Math.round(weather.current.pressureMb)} mb</p>
        </div>
        <div className="rounded-2xl bg-black/15 px-3 py-2">
          <p className="text-xs uppercase tracking-wide text-slate-300">Sunrise</p>
          <p className="mt-1 font-semibold">{weather.current.sunrise}</p>
        </div>
        <div className="rounded-2xl bg-black/15 px-3 py-2">
          <p className="text-xs uppercase tracking-wide text-slate-300">Sunset</p>
          <p className="mt-1 font-semibold">{weather.current.sunset}</p>
        </div>
      </div>
    </motion.section>
  );
}
