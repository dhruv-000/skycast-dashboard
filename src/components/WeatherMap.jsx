import { motion } from "framer-motion";

export default function WeatherMap({ mapUrl, locationLabel }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.85 }}
      className="glass-card rounded-3xl p-6"
    >
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white">Weather Map</h3>
        <p className="text-xs text-slate-300">Precipitation overlay near {locationLabel}</p>
      </div>
      <div className="overflow-hidden rounded-2xl border border-white/15">
        <iframe
          title="Weather map"
          src={mapUrl}
          className="h-[260px] w-full"
          loading="lazy"
        />
      </div>
    </motion.section>
  );
}
