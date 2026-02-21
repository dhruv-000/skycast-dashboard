export function getWeatherTheme(weather) {
  if (!weather) {
    return "clear";
  }

  const condition = weather.current.condition.text.toLowerCase();

  if (!weather.current.isDay) {
    return "night";
  }

  if (/thunder|storm|lightning/.test(condition)) {
    return "thunder";
  }

  if (/snow|sleet|blizzard|ice|freezing/.test(condition)) {
    return "snow";
  }

  if (/rain|drizzle|shower/.test(condition)) {
    return "rain";
  }

  if (/cloud|overcast|mist|fog|haze/.test(condition)) {
    return "cloudy";
  }

  return "clear";
}
