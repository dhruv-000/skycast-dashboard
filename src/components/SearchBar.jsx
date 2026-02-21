import { useState } from "react";
import { motion } from "framer-motion";

export default function SearchBar({
  value,
  onChange,
  onSearch,
  onSelectSuggestion,
  suggestions,
  loading,
  isLocating,
  onLocate,
}) {
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    setShowSuggestions(false);
    onSearch(value);
  };

  const handleSelect = (suggestion) => {
    setShowSuggestions(false);
    onSelectSuggestion(suggestion);
  };

  return (
    <div className="relative w-full">
      <form
        onSubmit={handleSubmit}
        className="flex w-full flex-col gap-2 sm:flex-row sm:items-center"
      >
        <div className="relative flex-1">
          <input
            type="text"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Search city (e.g. Tokyo, Paris, Austin)"
            className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-300/70 backdrop-blur-md transition focus:border-cyan-200/70 focus:outline-none"
          />

          {showSuggestions && suggestions.length > 0 && (
            <motion.ul
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute z-20 mt-2 max-h-60 w-full overflow-y-auto rounded-2xl border border-white/20 bg-slate-900/90 p-2 shadow-2xl"
            >
              {suggestions.map((suggestion) => (
                <li key={suggestion.id}>
                  <button
                    type="button"
                    onMouseDown={() => handleSelect(suggestion)}
                    className="w-full rounded-xl px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-cyan-500/15"
                  >
                    {suggestion.displayName}
                  </button>
                </li>
              ))}
            </motion.ul>
          )}
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-2xl bg-cyan-300/90 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Loading..." : "Search"}
          </button>
          <button
            type="button"
            onClick={onLocate}
            disabled={isLocating}
            className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLocating ? "Locating..." : "Use My Location"}
          </button>
        </div>
      </form>
    </div>
  );
}
