export function formatTemperature(temperature, unit) {
  const value = unit === "C" ? temperature.c : temperature.f;
  return `${Math.round(value)}\u00B0${unit}`;
}

export function formatSpeed(wind, unit) {
  if (unit === "C") {
    return `${Math.round(wind.kph)} km/h`;
  }

  return `${Math.round(wind.mph)} mph`;
}

export function formatVisibility(visibility, unit) {
  if (unit === "C") {
    return `${visibility.km.toFixed(1)} km`;
  }

  return `${visibility.miles.toFixed(1)} mi`;
}

export function formatFeelsLikeDiff(currentTemp, feelsLikeTemp) {
  const diff = feelsLikeTemp - currentTemp;

  if (Math.abs(diff) < 1) {
    return "Feels close to actual";
  }

  return diff > 0 ? "Feels warmer than actual" : "Feels cooler than actual";
}
