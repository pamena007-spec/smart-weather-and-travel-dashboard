# Smart Weather & Travel Dashboard

## Project Description

A responsive web application that shows real-time weather for any searched city, a 7-day forecast, and smart travel suggestions that change with the weather. Built with HTML, CSS and vanilla JavaScript using the free Open-Meteo API (no API key needed). Chennai loads by default.

## Features

- City search (button or Enter key) with validation and friendly errors
- Current weather: temperature, feels-like, condition, icon, humidity, wind speed and direction, date/time, sunrise, sunset
- 7-day forecast cards: day, icon, condition, max/min temperature, rain probability
- Weather icons that change with the condition
- Smart travel suggestions: message, things to do, packing list, travel rating and best day of the week to explore
- Responsive for mobile, tablet and desktop

## Technologies Used

HTML5, CSS3, JavaScript ES6+, Fetch API, async/await, Git and GitHub.

## API Used

[Open-Meteo](https://open-meteo.com/) Geocoding API and Forecast API (free, no key).

## Project Structure

```
smart-weather-travel-dashboard/
├── index.html
├── style.css
├── script.js
└── README.md
```

## How to Run

1. Download or clone the project.
2. Open the folder in VS Code.
3. Install the **Live Server** extension.
4. Right-click `index.html` and choose **Open with Live Server**.
5. Search for a city.

## How It Works

1. The city name is sent to the geocoding API, which returns latitude and longitude.
2. The coordinates are sent to the forecast API for current weather and 7 days of daily data.
3. Weather codes are converted into readable conditions, icons and a weather type (clear, rain, snow and so on).
4. The type, temperature and wind speed select the travel message, activities and packing tips, and produce a 0 to 100 travel score (Excellent, Good, Fair or Poor).
5. The same scoring is applied to each forecast day to find the best day to explore.

## Git and GitHub

```bash
git init
git add .
git commit -m "Initial Smart Weather & Travel Dashboard"
git branch -M main
git remote add origin YOUR_GITHUB_REPOSITORY_URL
git push -u origin main
```

Suggested commit messages:

1. `Create responsive dashboard layout`
2. `Integrate Open-Meteo geocoding and weather APIs`
3. `Add 7-day forecast cards`
4. `Implement smart travel suggestions`
5. `Improve error handling and documentation`
