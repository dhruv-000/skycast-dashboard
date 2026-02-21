const GEOCODING_BASE = "https://geocoding-api.open-meteo.com/v1";
const FORECAST_BASE = "https://api.open-meteo.com/v1/forecast";
const PROVIDER = "open-meteo";

function toFahrenheit(celsius) {
  return (celsius * 9) / 5 + 32;
}

function kphToMph(kph) {
  return kph * 0.621371;
}

function kmToMiles(km) {
  return km * 0.621371;
}

function degreeToCardinal(degree = 0) {
  const directions = [
    "N",
    "NNE",
    "NE",
    "ENE",
    "E",
    "ESE",
    "SE",
    "SSE",
    "S",
    "SSW",
    "SW",
    "WSW",
    "W",
    "WNW",
    "NW",
    "NNW",
  ];
  const normalized = ((degree % 360) + 360) % 360;
  const index = Math.round(normalized / 22.5) % 16;
  return directions[index];
}

function formatUtcShifted(epochSeconds, offsetSeconds, options) {
  return new Date((epochSeconds + offsetSeconds) * 1000).toLocaleString([], {
    timeZone: "UTC",
    ...options,
  });
}

function dateKeyFromShiftedEpoch(epochSeconds, offsetSeconds) {
  const shifted = new Date((epochSeconds + offsetSeconds) * 1000);
  const year = shifted.getUTCFullYear();
  const month = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  const day = String(shifted.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function weatherIconUrl(iconCode) {
  return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
}

function weatherCodeToCondition(code, isDay) {
  const suffix = isDay ? "d" : "n";

  if (code === 0) {
    return { text: "Clear sky", iconCode: `01${suffix}` };
  }

  if (code === 1) {
    return { text: "Mainly clear", iconCode: `02${suffix}` };
  }

  if (code === 2) {
    return { text: "Partly cloudy", iconCode: `03${suffix}` };
  }

  if (code === 3) {
    return { text: "Overcast", iconCode: `04${suffix}` };
  }

  if (code === 45 || code === 48) {
    return { text: "Fog", iconCode: `50${suffix}` };
  }

  if ([51, 53, 55, 56, 57].includes(code)) {
    return { text: "Drizzle", iconCode: `09${suffix}` };
  }

  if ([61, 63, 65, 66, 67].includes(code)) {
    return { text: "Rain", iconCode: `10${suffix}` };
  }

  if ([80, 81, 82].includes(code)) {
    return { text: "Rain showers", iconCode: `10${suffix}` };
  }

  if ([71, 73, 75, 77, 85, 86].includes(code)) {
    return { text: "Snow", iconCode: `13${suffix}` };
  }

  if ([95, 96, 99].includes(code)) {
    return { text: "Thunderstorm", iconCode: `11${suffix}` };
  }

  return { text: "Cloudy", iconCode: `03${suffix}` };
}

function mapCondition(code, isDay) {
  const mapped = weatherCodeToCondition(code, isDay);
  return {
    text: mapped.text,
    icon: weatherIconUrl(mapped.iconCode),
    code,
  };
}

async function requestJson(url) {
  const response = await fetch(url);
  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message =
      data?.reason || data?.error || data?.message || "Unable to fetch weather data.";
    throw new Error(message);
  }

  return data;
}

function formatRegion(result) {
  return result.admin1 || result.admin2 || result.admin3 || "";
}

function createLocationFromGeocode(result, fallbackLat, fallbackLon) {
  return {
    name: result?.name || "Current Location",
    region: result ? formatRegion(result) : "",
    country: result?.country || result?.country_code || "",
    timezone: result?.timezone || null,
    lat: Number(result?.latitude ?? fallbackLat),
    lon: Number(result?.longitude ?? fallbackLon),
  };
}

async function geocodeCity(cityName, count = 1) {
  const params = new URLSearchParams({
    name: cityName,
    count: String(count),
    language: "en",
    format: "json",
  });
  const url = `${GEOCODING_BASE}/search?${params.toString()}`;
  const data = await requestJson(url);
  return data?.results ?? [];
}

async function fetchForecast(lat, lon) {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    timezone: "auto",
    forecast_days: "7",
    timeformat: "unixtime",
    windspeed_unit: "kmh",
    current: [
      "temperature_2m",
      "apparent_temperature",
      "relative_humidity_2m",
      "is_day",
      "weather_code",
      "wind_speed_10m",
      "wind_direction_10m",
      "surface_pressure",
      "visibility",
      "uv_index",
    ].join(","),
    hourly: [
      "temperature_2m",
      "weather_code",
      "precipitation_probability",
      "is_day",
    ].join(","),
    daily: [
      "weather_code",
      "temperature_2m_max",
      "temperature_2m_min",
      "precipitation_probability_max",
      "sunrise",
      "sunset",
    ].join(","),
  });

  return requestJson(`${FORECAST_BASE}?${params.toString()}`);
}

function normalizeOpenMeteo(forecast, location) {
  const offset = forecast.utc_offset_seconds || 0;
  const hourly = forecast.hourly || {};
  const daily = forecast.daily || {};
  const current = forecast.current || {};

  const hourlyTimes = hourly.time || [];
  const nowEpoch = current.time || hourlyTimes[0];
  let startIndex = hourlyTimes.findIndex((time) => time >= nowEpoch);
  if (startIndex < 0) {
    startIndex = 0;
  }

  const currentDayKey = dateKeyFromShiftedEpoch(nowEpoch, offset);
  const dailyTimes = daily.time || [];
  let currentDayIndex = dailyTimes.findIndex(
    (time) => dateKeyFromShiftedEpoch(time, offset) === currentDayKey,
  );
  if (currentDayIndex < 0) {
    currentDayIndex = 0;
  }

  const currentIsDay = (current.is_day ?? 1) === 1;
  const currentCode = current.weather_code ?? hourly.weather_code?.[startIndex] ?? 0;
  const currentCondition = mapCondition(currentCode, currentIsDay);

  const hourlyForecast = hourlyTimes
    .slice(startIndex, startIndex + 24)
    .map((timeEpoch, offsetIndex) => {
      const index = startIndex + offsetIndex;
      const isDay = (hourly.is_day?.[index] ?? (currentIsDay ? 1 : 0)) === 1;
      const weatherCode = hourly.weather_code?.[index] ?? currentCode;
      const condition = mapCondition(weatherCode, isDay);
      const tempC = hourly.temperature_2m?.[index] ?? current.temperature_2m ?? 0;
      const rainChance = hourly.precipitation_probability?.[index] ?? 0;

      return {
        timeEpoch,
        timeLabel: formatUtcShifted(timeEpoch, offset, { hour: "numeric" }),
        temp: { c: tempC, f: toFahrenheit(tempC) },
        condition,
        chanceOfRain: Math.round(rainChance),
      };
    });

  const dailyForecast = dailyTimes.slice(0, 7).map((timeEpoch, index) => {
    const weatherCode = daily.weather_code?.[index] ?? 0;
    const condition = mapCondition(weatherCode, true);
    const minC = daily.temperature_2m_min?.[index] ?? 0;
    const maxC = daily.temperature_2m_max?.[index] ?? 0;
    const sunriseEpoch = daily.sunrise?.[index];
    const sunsetEpoch = daily.sunset?.[index];

    return {
      date: dateKeyFromShiftedEpoch(timeEpoch, offset),
      dayLabel: formatUtcShifted(timeEpoch, offset, {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
      min: { c: minC, f: toFahrenheit(minC) },
      max: { c: maxC, f: toFahrenheit(maxC) },
      chanceOfRain: Math.round(daily.precipitation_probability_max?.[index] ?? 0),
      condition,
      sunrise:
        sunriseEpoch != null
          ? formatUtcShifted(sunriseEpoch, offset, { hour: "numeric", minute: "2-digit" })
          : "-",
      sunset:
        sunsetEpoch != null
          ? formatUtcShifted(sunsetEpoch, offset, { hour: "numeric", minute: "2-digit" })
          : "-",
    };
  });

  const sunriseEpoch = daily.sunrise?.[currentDayIndex];
  const sunsetEpoch = daily.sunset?.[currentDayIndex];
  const currentTempC = current.temperature_2m ?? hourly.temperature_2m?.[startIndex] ?? 0;
  const feelsLikeC = current.apparent_temperature ?? currentTempC;
  const windKph = current.wind_speed_10m ?? 0;
  const visibilityKm = (current.visibility ?? 0) / 1000;
  const windDegree = current.wind_direction_10m ?? 0;

  return {
    provider: PROVIDER,
    location: {
      name: location.name,
      region: location.region,
      country: location.country,
      lat: location.lat,
      lon: location.lon,
      timezone: forecast.timezone || location.timezone,
      localTimeLabel: formatUtcShifted(nowEpoch, offset, {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }),
    },
    current: {
      temp: { c: currentTempC, f: toFahrenheit(currentTempC) },
      feelsLike: { c: feelsLikeC, f: toFahrenheit(feelsLikeC) },
      humidity: current.relative_humidity_2m ?? 0,
      wind: {
        kph: windKph,
        mph: kphToMph(windKph),
        degree: windDegree,
        direction: degreeToCardinal(windDegree),
      },
      uv: current.uv_index ?? null,
      visibility: {
        km: visibilityKm,
        miles: kmToMiles(visibilityKm),
      },
      pressureMb: current.surface_pressure ?? 0,
      sunrise:
        sunriseEpoch != null
          ? formatUtcShifted(sunriseEpoch, offset, { hour: "numeric", minute: "2-digit" })
          : "-",
      sunset:
        sunsetEpoch != null
          ? formatUtcShifted(sunsetEpoch, offset, { hour: "numeric", minute: "2-digit" })
          : "-",
      isDay: currentIsDay,
      condition: currentCondition,
    },
    hourly: hourlyForecast,
    daily: dailyForecast,
  };
}

export async function fetchWeatherByCity(cityName) {
  const city = cityName.trim();
  if (!city) {
    throw new Error("Enter a city name.");
  }

  const matches = await geocodeCity(city, 1);
  if (!matches.length) {
    throw new Error("City not found. Try a different name.");
  }

  const match = matches[0];
  const location = createLocationFromGeocode(match, match.latitude, match.longitude);
  const forecast = await fetchForecast(location.lat, location.lon);
  return normalizeOpenMeteo(forecast, location);
}

export async function fetchWeatherByCoords(lat, lon, locationHint = null) {
  const numericLat = Number(lat);
  const numericLon = Number(lon);
  const location = locationHint
    ? {
        name: locationHint.name || "Current Location",
        region: locationHint.region || "",
        country: locationHint.country || "",
        timezone: locationHint.timezone || null,
        lat: numericLat,
        lon: numericLon,
      }
    : createLocationFromGeocode(null, numericLat, numericLon);
  const forecast = await fetchForecast(numericLat, numericLon);
  return normalizeOpenMeteo(forecast, location);
}

export async function searchCities(query) {
  const text = query.trim();
  if (text.length < 2) {
    return [];
  }

  const results = await geocodeCity(text, 6);
  return results.map((city) => {
    const region = formatRegion(city);
    return {
      id: `${city.id ?? city.name}-${city.latitude}-${city.longitude}`,
      name: city.name,
      region,
      country: city.country || city.country_code || "",
      lat: city.latitude,
      lon: city.longitude,
      displayName: `${city.name}${region ? `, ${region}` : ""}, ${city.country || city.country_code || ""}`,
    };
  });
}

export function getActiveProvider() {
  return PROVIDER;
}

export function getWeatherMapEmbedUrl(lat, lon) {
  const latitude = Number(lat).toFixed(4);
  const longitude = Number(lon).toFixed(4);
  return `https://embed.windy.com/embed2.html?lat=${latitude}&lon=${longitude}&zoom=5&level=surface&overlay=rain&menu=&message=true&marker=true&calendar=now&pressure=true&type=map&location=coordinates&detail=true&detailLat=${latitude}&detailLon=${longitude}&metricWind=default&metricTemp=default`;
}
