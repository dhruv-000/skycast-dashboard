import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import SearchBar from "./components/SearchBar";
import CurrentWeatherCard from "./components/CurrentWeatherCard";
import MetricsGrid from "./components/MetricsGrid";
import HourlyForecast from "./components/HourlyForecast";
import DailyForecast from "./components/DailyForecast";
import Favorites from "./components/Favorites";
import { useLocalStorage } from "./hooks/useLocalStorage";
import {
  fetchWeatherByCity,
  fetchWeatherByCoords,
  getActiveProvider,
  getWeatherMapEmbedUrl,
  searchCities,
} from "./services/weatherApi";
import { getWeatherTheme } from "./utils/weatherTheme";

const DEFAULT_CITY = import.meta.env.VITE_DEFAULT_CITY || "New York";
const ForecastChart = lazy(() => import("./components/ForecastChart"));
const WeatherMap = lazy(() => import("./components/WeatherMap"));

function createFavoriteFromWeather(weather) {
  const id = `${weather.location.name}-${weather.location.country}`.toLowerCase();
  return {
    id,
    name: weather.location.name,
    country: weather.location.country,
    query: `${weather.location.name}, ${weather.location.country}`,
  };
}

function App() {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isLocating, setIsLocating] = useState(false);
  const [provider, setProvider] = useState("");
  const [unit, setUnit] = useLocalStorage("weather-unit", "C");
  const [favorites, setFavorites] = useLocalStorage("weather-favorites", []);
  const [savedTarget, setSavedTarget] = useLocalStorage("weather-target", null);
  const [activeTarget, setActiveTarget] = useState(savedTarget);

  const theme = useMemo(() => getWeatherTheme(weather), [weather]);

  const mapUrl = useMemo(() => {
    if (!weather) {
      return "";
    }

    return getWeatherMapEmbedUrl(weather.location.lat, weather.location.lon);
  }, [weather]);

  const currentFavoriteId = weather
    ? `${weather.location.name}-${weather.location.country}`.toLowerCase()
    : "";
  const providerLabel = provider === "open-meteo" ? "Open-Meteo" : provider;

  const isFavorite = favorites.some((city) => city.id === currentFavoriteId);

  const runWeatherRequest = async (requestFn, nextTarget) => {
    setLoading(true);
    setError("");

    try {
      const data = await requestFn();
      setWeather(data);
      setActiveTarget(nextTarget);
      setSavedTarget(nextTarget);
    } catch (requestError) {
      setError(requestError.message || "Unable to fetch weather right now.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (city) => {
    const query = city.trim();
    if (!query) {
      setError("Please enter a city name.");
      return;
    }

    await runWeatherRequest(() => fetchWeatherByCity(query), {
      type: "city",
      value: query,
    });
  };

  const handleSelectSuggestion = async (suggestion) => {
    setSearchValue(suggestion.displayName);
    setSuggestions([]);

    await runWeatherRequest(
      () => fetchWeatherByCoords(suggestion.lat, suggestion.lon, suggestion),
      {
        type: "coords",
        lat: suggestion.lat,
        lon: suggestion.lon,
        name: suggestion.name,
        region: suggestion.region,
        country: suggestion.country,
      },
    );
  };

  const locateAndLoadWeather = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported. Showing default city.");
      void handleSearch(DEFAULT_CITY);
      return;
    }

    setIsLocating(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        await runWeatherRequest(
          () => fetchWeatherByCoords(latitude, longitude),
          {
            type: "coords",
            lat: latitude,
            lon: longitude,
          },
        );
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
        setError("Location access denied. Showing default city.");
        void handleSearch(DEFAULT_CITY);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      },
    );
  };

  const refreshWeather = async () => {
    if (!activeTarget) {
      await handleSearch(DEFAULT_CITY);
      return;
    }

    if (activeTarget.type === "coords") {
      await runWeatherRequest(
        () =>
          fetchWeatherByCoords(activeTarget.lat, activeTarget.lon, activeTarget),
        activeTarget,
      );
      return;
    }

    await runWeatherRequest(
      () => fetchWeatherByCity(activeTarget.value),
      activeTarget,
    );
  };

  const toggleFavorite = () => {
    if (!weather) {
      return;
    }

    const favorite = createFavoriteFromWeather(weather);
    const exists = favorites.some((item) => item.id === favorite.id);

    if (exists) {
      setFavorites((current) => current.filter((item) => item.id !== favorite.id));
      return;
    }

    setFavorites((current) => [favorite, ...current].slice(0, 8));
  };

  const removeFavorite = (id) => {
    setFavorites((current) => current.filter((city) => city.id !== id));
  };

  const selectFavorite = async (city) => {
    await handleSearch(city.query);
  };

  useEffect(() => {
    const setup = async () => {
      try {
        setProvider(getActiveProvider());
      } catch (providerError) {
        setError(providerError.message);
        return;
      }

      const hasInitialized = window.localStorage.getItem("weather-initialized");
      if (savedTarget) {
        setActiveTarget(savedTarget);
        if (savedTarget.type === "coords") {
          await runWeatherRequest(
            () => fetchWeatherByCoords(savedTarget.lat, savedTarget.lon, savedTarget),
            savedTarget,
          );
          return;
        }

        await runWeatherRequest(
          () => fetchWeatherByCity(savedTarget.value),
          savedTarget,
        );
        return;
      }

      if (!hasInitialized) {
        window.localStorage.setItem("weather-initialized", "1");
        locateAndLoadWeather();
        return;
      }

      await handleSearch(DEFAULT_CITY);
    };

    setup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const text = searchValue.trim();
    if (text.length < 2) {
      setSuggestions([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        const result = await searchCities(text);
        setSuggestions(result);
      } catch {
        setSuggestions([]);
      }
    }, 280);

    return () => clearTimeout(timeoutId);
  }, [searchValue]);

  return (
    <main className={`weather-shell theme-${theme}`}>
      <div className="absolute inset-0 -z-10">
        <div className="dynamic-bg" />
        {(theme === "rain" || theme === "thunder") && <div className="rain-overlay" />}
        {theme === "snow" && <div className="snow-overlay" />}
        {theme === "night" && <div className="stars-overlay" />}
        {theme === "thunder" && <div className="thunder-flash" />}
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-10 pt-6 sm:px-6 lg:px-8">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <img
                src="/weather-logo.svg"
                alt="Weather Dashboard logo"
                className="h-11 w-11 rounded-2xl border border-white/20 bg-white/10 p-1 shadow-lg"
              />
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-cyan-100/80">
                  Live Weather Dashboard
                </p>
                <h1 className="text-3xl font-bold text-white sm:text-4xl">
                  Real-Time Global Forecast
                </h1>
                <p className="text-xs text-cyan-100/80">Made by Dhruv Gosavi</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs text-slate-100">
                Provider: {providerLabel}
              </span>
              <button
                type="button"
                onClick={() => setUnit((current) => (current === "C" ? "F" : "C"))}
                className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/20"
              >
                Switch to {"\u00B0"}
                {unit === "C" ? "F" : "C"}
              </button>
              <button
                type="button"
                onClick={refreshWeather}
                disabled={loading}
                className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>

          <SearchBar
            value={searchValue}
            onChange={setSearchValue}
            onSearch={handleSearch}
            onSelectSuggestion={handleSelectSuggestion}
            suggestions={suggestions}
            loading={loading}
            isLocating={isLocating}
            onLocate={locateAndLoadWeather}
          />
        </motion.header>

        {error ? (
          <div className="mb-6 rounded-2xl border border-rose-200/40 bg-rose-600/20 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        ) : null}

        {loading && !weather ? (
          <div className="glass-card rounded-3xl p-10 text-center text-slate-100">
            Loading weather data...
          </div>
        ) : null}

        {!loading && !weather && !error ? (
          <div className="glass-card rounded-3xl p-10 text-center text-slate-100">
            Search for any city worldwide or use your current location to begin.
          </div>
        ) : null}

        {weather ? (
          <section className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-[1.25fr_1fr]">
              <CurrentWeatherCard
                weather={weather}
                unit={unit}
                isFavorite={isFavorite}
                onToggleFavorite={toggleFavorite}
              />
              <MetricsGrid weather={weather} unit={unit} />
            </div>

            <HourlyForecast hourly={weather.hourly} unit={unit} />
            <Suspense
              fallback={
                <div className="glass-card rounded-3xl p-6 text-sm text-slate-100">
                  Loading chart...
                </div>
              }
            >
              <ForecastChart hourly={weather.hourly} unit={unit} />
            </Suspense>
            <DailyForecast daily={weather.daily} unit={unit} />

            <div className="grid gap-6 xl:grid-cols-2">
              <Favorites
                favorites={favorites}
                onSelect={selectFavorite}
                onRemove={removeFavorite}
              />
              <Suspense
                fallback={
                  <div className="glass-card rounded-3xl p-6 text-sm text-slate-100">
                    Loading map...
                  </div>
                }
              >
                <WeatherMap mapUrl={mapUrl} locationLabel={weather.location.name} />
              </Suspense>
            </div>
            <footer className="pt-2 text-center text-xs text-cyan-100/85">
              Website made by Dhruv Gosavi
            </footer>
          </section>
        ) : null}
      </div>
    </main>
  );
}

export default App;
