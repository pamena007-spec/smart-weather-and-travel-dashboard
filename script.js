/* ==========================================================
   Smart Weather & Travel Dashboard - script.js
   APIs: Open-Meteo Geocoding + Forecast (no API key needed)
   ========================================================== */

const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const WEATHER_URL = "https://api.open-meteo.com/v1/forecast";
const DEFAULT_CITY = "Chennai";

// ----- DOM elements -----
const searchForm = document.getElementById("search-form");
const cityInput = document.getElementById("city-input");
const searchBtn = document.getElementById("search-btn");
const loadingEl = document.getElementById("loading");
const errorEl = document.getElementById("error");
const dashboardEl = document.getElementById("dashboard");

const el = (id) => document.getElementById(id);

// ----- Weather codes (WMO) grouped into categories -----
const WEATHER_CODES = {
  0:  { label: "Clear Sky",        icon: "☀️", nightIcon: "🌙", type: "clear" },
  1:  { label: "Mainly Clear",     icon: "🌤️", nightIcon: "🌙", type: "clear" },
  2:  { label: "Partly Cloudy",    icon: "⛅", nightIcon: "☁️", type: "partly" },
  3:  { label: "Overcast",         icon: "☁️", type: "cloudy" },
  45: { label: "Foggy",            icon: "🌫️", type: "fog" },
  48: { label: "Rime Fog",         icon: "🌫️", type: "fog" },
  51: { label: "Light Drizzle",    icon: "🌦️", type: "drizzle" },
  53: { label: "Drizzle",          icon: "🌦️", type: "drizzle" },
  55: { label: "Heavy Drizzle",    icon: "🌦️", type: "drizzle" },
  56: { label: "Freezing Drizzle", icon: "🌧️", type: "drizzle" },
  57: { label: "Freezing Drizzle", icon: "🌧️", type: "drizzle" },
  61: { label: "Light Rain",       icon: "🌧️", type: "rain" },
  63: { label: "Rain",             icon: "🌧️", type: "rain" },
  65: { label: "Heavy Rain",       icon: "🌧️", type: "rain" },
  66: { label: "Freezing Rain",    icon: "🌧️", type: "rain" },
  67: { label: "Freezing Rain",    icon: "🌧️", type: "rain" },
  71: { label: "Light Snow",       icon: "🌨️", type: "snow" },
  73: { label: "Snow",             icon: "❄️", type: "snow" },
  75: { label: "Heavy Snow",       icon: "❄️", type: "snow" },
  77: { label: "Snow Grains",      icon: "❄️", type: "snow" },
  80: { label: "Rain Showers",     icon: "🌦️", type: "rain" },
  81: { label: "Rain Showers",     icon: "🌧️", type: "rain" },
  82: { label: "Heavy Showers",    icon: "⛈️", type: "rain" },
  85: { label: "Snow Showers",     icon: "🌨️", type: "snow" },
  86: { label: "Heavy Snow Showers", icon: "❄️", type: "snow" },
  95: { label: "Thunderstorm",     icon: "⛈️", type: "thunder" },
  96: { label: "Thunderstorm, Hail", icon: "⛈️", type: "thunder" },
  99: { label: "Thunderstorm, Hail", icon: "⛈️", type: "thunder" }
};

function getWeatherInfo(code, isDay = true) {
  const info = WEATHER_CODES[code] || { label: "Unknown", icon: "🌡️", type: "cloudy" };
  const icon = !isDay && info.nightIcon ? info.nightIcon : info.icon;
  return { label: info.label, icon, type: info.type };
}

// ----- Travel suggestion data -----
// Each weather type has a message, things to do, packing tips and a base score (0-100).
const TRAVEL_TIPS = {
  clear: {
    score: 95,
    message: "Great weather for sightseeing, outdoor activities and photography.",
    activities: ["Walking tours and sightseeing", "Parks, beaches or viewpoints", "Outdoor photography"],
    packing: ["Sunglasses", "Sunscreen", "Comfortable walking shoes"]
  },
  partly: {
    score: 85,
    message: "Pleasant conditions with some clouds. A good day for exploring the city on foot.",
    activities: ["City walks and markets", "Outdoor cafes", "Visiting landmarks"],
    packing: ["Light jacket", "Sunglasses", "Water bottle"]
  },
  cloudy: {
    score: 70,
    message: "Cloudy but comfortable. Good for a mix of outdoor and indoor sightseeing.",
    activities: ["Museums and galleries", "Old town walks", "Local food tours"],
    packing: ["Light layers", "Small umbrella just in case"]
  },
  fog: {
    score: 50,
    message: "Low visibility. Avoid viewpoints and long drives, and choose indoor plans.",
    activities: ["Museums and indoor attractions", "Cafes and restaurants", "Shopping centres"],
    packing: ["Warm layers", "Reflective or bright clothing", "Phone charger"]
  },
  drizzle: {
    score: 50,
    message: "Light drizzle expected. Outdoor plans are possible with a raincoat, but indoor options are safer.",
    activities: ["Museums and galleries", "Cafes and bookshops", "Covered markets"],
    packing: ["Raincoat or umbrella", "Water-resistant shoes"]
  },
  rain: {
    score: 35,
    message: "Rainy weather. Plan indoor activities and allow extra time for travel.",
    activities: ["Museums and indoor attractions", "Shopping malls", "Local cafes and restaurants"],
    packing: ["Umbrella", "Waterproof jacket", "Waterproof bag cover"]
  },
  snow: {
    score: 40,
    message: "Snowy conditions. Roads may be slippery, so check transport updates before heading out.",
    activities: ["Snow photography", "Cozy cafes", "Winter sports if available"],
    packing: ["Heavy coat", "Gloves and hat", "Waterproof boots"]
  },
  thunder: {
    score: 15,
    message: "Thunderstorms expected. Stay indoors and postpone outdoor travel if you can.",
    activities: ["Stay indoors", "Museums and malls", "Check flight and train updates"],
    packing: ["Umbrella", "Power bank", "Waterproof bag"]
  }
};

// ----- Small helpers -----
function showLoading(isLoading) {
  loadingEl.classList.toggle("hidden", !isLoading);
  searchBtn.disabled = isLoading;
  cityInput.disabled = isLoading;
}

function showError(message) {
  errorEl.textContent = message;
  errorEl.classList.remove("hidden");
}

function clearError() {
  errorEl.textContent = "";
  errorEl.classList.add("hidden");
}

function formatTime(isoString) {
  const date = new Date(isoString);
  if (!isoString || Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function formatDateTime(isoString) {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleString("en-US", {
    weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit"
  });
}

function formatValue(value, unit) {
  return value === undefined || value === null ? "N/A" : `${Math.round(value)}${unit}`;
}

/** Convert wind degrees (0-360) to a compass direction such as "NE". */
function getWindDirection(degrees) {
  if (degrees === undefined || degrees === null) return "N/A";
  const points = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
                  "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  return `${points[Math.round(degrees / 22.5) % 16]} (${Math.round(degrees)}°)`;
}

// ----- API functions -----

/** Step 1: city name -> coordinates. */
async function fetchCityCoordinates(city) {
  const url = `${GEOCODING_URL}?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("API_FAILED");

  const data = await response.json();
  if (!data.results || data.results.length === 0) throw new Error("CITY_NOT_FOUND");

  const { name, country, latitude, longitude } = data.results[0];
  return { name, country: country || "Unknown country", latitude, longitude };
}

/** Step 2: coordinates -> current weather + 7-day forecast. */
async function fetchWeather(latitude, longitude) {
  const params = new URLSearchParams({
    latitude,
    longitude,
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,wind_direction_10m",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max,sunrise,sunset",
    wind_speed_unit: "kmh",
    temperature_unit: "celsius",
    timezone: "auto",
    forecast_days: 7
  });

  const response = await fetch(`${WEATHER_URL}?${params.toString()}`);
  if (!response.ok) throw new Error("API_FAILED");

  const data = await response.json();
  if (!data.current || typeof data.current.temperature_2m !== "number" ||
      !data.daily || !Array.isArray(data.daily.time)) {
    throw new Error("BAD_RESPONSE");
  }
  return data;
}

// ----- Travel logic -----

/** Turn the weather into a 0-100 travel score. */
function calculateTravelScore(type, temp, windSpeed, rainChance = 0) {
  let score = TRAVEL_TIPS[type].score;

  if (temp > 38 || temp < 0) score -= 20;
  else if (temp > 33 || temp < 8) score -= 10;

  if (windSpeed > 50) score -= 15;
  else if (windSpeed > 35) score -= 8;

  score -= Math.round(rainChance * 0.2);
  return Math.max(0, Math.min(100, score));
}

function getRatingLabel(score) {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Fair";
  return "Poor";
}

/** Build the suggestion text and lists from the current conditions. */
function buildTravelSuggestions(type, temp, windSpeed) {
  const tips = TRAVEL_TIPS[type];
  const activities = [...tips.activities];
  const packing = [...tips.packing];
  let message = tips.message;

  // Extra advice for extreme temperature or strong wind
  if (temp >= 33) {
    message += " It is hot, so drink plenty of water and avoid midday sun.";
    packing.push("Light cotton clothes", "Reusable water bottle");
  } else if (temp <= 8) {
    message += " It is cold, so dress warmly.";
    packing.push("Warm jacket", "Scarf and gloves");
  }
  if (windSpeed > 35) {
    message += " Strong winds are expected, so be careful near coasts and high places.";
  }

  return { message, activities, packing };
}

// ----- Display functions -----

function fillList(listId, items) {
  const list = el(listId);
  list.replaceChildren();
  items.forEach((text) => {
    const li = document.createElement("li");
    li.textContent = text;
    list.appendChild(li);
  });
}

function displayCurrentWeather(place, weather) {
  const { current, daily } = weather;
  const { label, icon } = getWeatherInfo(current.weather_code, current.is_day === 1);

  el("city-name").textContent = place.name;
  el("country").textContent = place.country;
  el("date-time").textContent = formatDateTime(current.time);
  el("weather-icon").textContent = icon;
  el("temperature").textContent = `${Math.round(current.temperature_2m)}°C`;
  el("condition").textContent = label;
  el("feels-like").textContent = formatValue(current.apparent_temperature, "°C");
  el("humidity").textContent = formatValue(current.relative_humidity_2m, "%");
  el("wind-speed").textContent = formatValue(current.wind_speed_10m, " km/h");
  el("wind-direction").textContent = getWindDirection(current.wind_direction_10m);
  el("sunrise").textContent = daily.sunrise ? formatTime(daily.sunrise[0]) : "N/A";
  el("sunset").textContent = daily.sunset ? formatTime(daily.sunset[0]) : "N/A";
}

function displayTravelSuggestions(weather) {
  const { current, daily } = weather;
  const { type } = getWeatherInfo(current.weather_code, current.is_day === 1);
  const temp = current.temperature_2m;
  const wind = current.wind_speed_10m ?? 0;
  const rainChance = daily.precipitation_probability_max ? daily.precipitation_probability_max[0] ?? 0 : 0;

  const suggestions = buildTravelSuggestions(type, temp, wind);
  const score = calculateTravelScore(type, temp, wind, rainChance);
  const rating = getRatingLabel(score);

  el("travel-message").textContent = suggestions.message;
  fillList("activity-list", suggestions.activities);
  fillList("packing-list", suggestions.packing);

  const ratingEl = el("travel-rating");
  ratingEl.textContent = `${rating} travel day`;
  ratingEl.className = `rating ${rating.toLowerCase()}`;

  displayBestDay(daily);
}

/** Find the forecast day with the best travel score. */
function displayBestDay(daily) {
  let bestIndex = 0;
  let bestScore = -1;

  daily.time.forEach((_, i) => {
    const { type } = getWeatherInfo(daily.weather_code[i]);
    const avgTemp = (daily.temperature_2m_max[i] + daily.temperature_2m_min[i]) / 2;
    const wind = daily.wind_speed_10m_max ? daily.wind_speed_10m_max[i] ?? 0 : 0;
    const rain = daily.precipitation_probability_max ? daily.precipitation_probability_max[i] ?? 0 : 0;
    const score = calculateTravelScore(type, avgTemp, wind, rain);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  });

  const { label } = formatForecastDay(daily.time[bestIndex], bestIndex);
  el("best-day").textContent = `Best day to explore this week: ${label}`;
}

function formatForecastDay(dateString, index) {
  const date = new Date(`${dateString}T00:00:00`);
  const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
  const shortDate = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return { label: index === 0 ? "Today" : weekday, shortDate };
}

function displayForecast(daily) {
  const container = el("forecast");
  container.replaceChildren();

  daily.time.forEach((dateString, i) => {
    const { label, icon } = getWeatherInfo(daily.weather_code[i]);
    const { label: dayLabel, shortDate } = formatForecastDay(dateString, i);
    const rain = daily.precipitation_probability_max ? daily.precipitation_probability_max[i] : null;

    const card = document.createElement("article");
    card.className = "forecast-card";
    card.innerHTML = `
      <p class="forecast-day">${dayLabel}</p>
      <p class="forecast-date">${shortDate}</p>
      <p class="forecast-icon" aria-hidden="true">${icon}</p>
      <p class="forecast-condition">${label}</p>
      <p class="forecast-temps">${Math.round(daily.temperature_2m_max[i])}°C
        <span class="min">/ ${Math.round(daily.temperature_2m_min[i])}°C</span></p>
      <p class="forecast-rain">Rain: ${rain === null || rain === undefined ? "N/A" : rain + "%"}</p>
    `;
    container.appendChild(card);
  });
}

function getFriendlyMessage(error) {
  switch (error.message) {
    case "CITY_NOT_FOUND":
      return "City not found. Check the spelling and try again.";
    case "API_FAILED":
      return "The weather service is not responding right now. Please try again later.";
    case "BAD_RESPONSE":
      return "The weather service sent unexpected data. Please try again.";
    default:
      return "Could not connect. Check your internet connection and try again.";
  }
}

// ----- Main flow -----

async function searchWeather(city) {
  clearError();
  showLoading(true);

  try {
    const place = await fetchCityCoordinates(city);
    const weather = await fetchWeather(place.latitude, place.longitude);

    displayCurrentWeather(place, weather);
    displayTravelSuggestions(weather);
    displayForecast(weather.daily);

    dashboardEl.classList.remove("hidden");
  } catch (error) {
    dashboardEl.classList.add("hidden");
    showError(getFriendlyMessage(error));
  } finally {
    showLoading(false);
    cityInput.focus();
  }
}

function handleSearch(event) {
  event.preventDefault();
  const city = cityInput.value.trim();

  if (city === "") {
    showError("Please enter a city name.");
    return;
  }
  if (!/^[\p{L}\s.'-]+$/u.test(city)) {
    showError("Please enter a valid city name (letters only).");
    return;
  }
  searchWeather(city);
}

// ----- Events -----
searchForm.addEventListener("submit", handleSearch);
document.addEventListener("DOMContentLoaded", () => searchWeather(DEFAULT_CITY));
