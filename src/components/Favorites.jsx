import { motion } from "framer-motion";

export default function Favorites({ favorites, onSelect, onRemove }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="glass-card rounded-3xl p-6"
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Favorite Cities</h3>
        <p className="text-xs text-slate-300">{favorites.length} saved</p>
      </div>

      {favorites.length === 0 ? (
        <p className="text-sm text-slate-300">
          Save places for one-tap weather lookup.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {favorites.map((city) => (
            <div
              key={city.id}
              className="flex items-center gap-1 rounded-2xl border border-white/15 bg-black/20 pl-3"
            >
              <button
                type="button"
                onClick={() => onSelect(city)}
                className="py-2 pr-2 text-sm text-white hover:text-cyan-100"
              >
                {city.name}, {city.country}
              </button>
              <button
                type="button"
                onClick={() => onRemove(city.id)}
                className="rounded-r-2xl border-l border-white/15 px-2 py-2 text-xs text-slate-300 hover:bg-white/10 hover:text-white"
              >
                x
              </button>
            </div>
          ))}
        </div>
      )}
    </motion.section>
  );
}
