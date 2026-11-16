const state = {
  readings: [],
  lastUpdated: null,
  weatherFeed: "unknown",
  airFeed: "unknown",
  gapCount: 0
};

async function getWeather() {
  try {
    const response = await fetch("https://api.open-meteo.com/v1/forecast?latitude=52.13&longitude=-106.67&hourly=temperature_2m,relative_humidity_2m&forecast_days=1");
    if (!response.ok) {
      throw new Error("Weather request failed with status " + response.status);
    }
    return await response.json();
  } catch (error) {
    console.log("Weather fetch failed:", error.message);
    return null;
  }
}

async function getAirQuality() {
  try {
    const response = await fetch("https://air-quality-api.open-meteo.com/v1/air-quality?latitude=52.13&longitude=-106.67&hourly=pm2_5,pm10&forecast_days=1");
    if (!response.ok) {
      throw new Error("Air quality request failed with status " + response.status);
    }
    return await response.json();
  } catch (error) {
    console.log("Air quality fetch failed:", error.message);
    return null;
  }
}

function cleanJoined(weather, air) {
  const readings = [];
  const times = weather.hourly.time;
  const temps = weather.hourly.temperature_2m;
  const humidity = weather.hourly.relative_humidity_2m;
  const pm25 = air ? air.hourly.pm2_5 : null;
  const pm10 = air ? air.hourly.pm10 : null;
  for (let i = 0; i < times.length; i++) {
    const row = {
      hour: times[i],
      temperature: temps[i],
      humidity: humidity[i],
      pm25: pm25 ? pm25[i] : null,
      pm10: pm10 ? pm10[i] : null,
      flags: []
    };
    if (row.temperature === null && i > 0 && i < times.length - 1) {
      const before = temps[i - 1];
      const after = temps[i + 1];
      if (before !== null && after !== null) {
        row.temperature = (before + after) / 2;
        row.flags.push("temperature imputed from neighbours");
      } else {
        row.flags.push("temperature missing");
      }
    }
    if (row.temperature !== null && row.temperature > 60) {
      row.temperature = null;
      row.flags.push("temperature out of range, row removed from chart");
    }
    if (row.humidity === null) {
      row.humidity = 50;
      row.flags.push("humidity default value used");
    }
    if (row.pm25 === null) {
      row.flags.push("PM2.5 missing");
    }
    if (row.pm10 === null) {
      row.flags.push("PM10 missing");
    }
    readings.push(row);
  }
  return readings;
}

function summarize(readings) {
  const valid = readings.filter(function (row) {
    return row.temperature !== null;
  });
  const flagged = readings.filter(function (row) {
    return row.flags.length > 0;
  });
  let mean = null;
  let minimum = null;
  let maximum = null;
  if (valid.length > 0) {
    const total = valid.reduce(function (sum, row) {
      return sum + row.temperature;
    }, 0);
    mean = total / valid.length;
    minimum = Math.min.apply(null, valid.map(function (row) {
      return row.temperature;
    }));
    maximum = Math.max.apply(null, valid.map(function (row) {
      return row.temperature;
    }));
  }
  return {
    hours: readings.length,
    validHours: valid.length,
    flaggedHours: flagged.length,
    meanTemperature: mean,
    minimumTemperature: minimum,
    maximumTemperature: maximum
  };
}

function render() {
  const latest = state.readings[state.readings.length - 1];
  const status = document.getElementById("feed-status");
  status.textContent = "Feed status: weather " + state.weatherFeed + ", air " + state.airFeed + ", updated " + state.lastUpdated;
  setCard("temperature-card", "temperature-note", latest, "temperature", " \u00b0C");
  setCard("humidity-card", "humidity-note", latest, "humidity", " %");
  setCard("pm25-card", "pm25-note", latest, "pm25", "");
  setCard("pm10-card", "pm10-note", latest, "pm10", "");
  const summary = summarize(state.readings);
  const report = document.getElementById("gap-report");
  report.textContent = summary.hours + " hours, " + summary.validHours + " valid, " + summary.flaggedHours + " flagged, mean temperature " + summary.meanTemperature;
}

function setCard(cardId, noteId, latest, field, unit) {
  const card = document.getElementById(cardId);
  const note = document.getElementById(noteId);
  if (!latest || latest[field] === null) {
    card.textContent = "No reading";
    note.textContent = latest ? latest.flags.join("; ") : "";
  } else {
    card.textContent = latest[field] + unit;
    note.textContent = latest.flags.join("; ");
  }
}

async function runPipeline() {
  const results = await Promise.all([getWeather(), getAirQuality()]);
  const weather = results[0];
  const air = results[1];
  state.weatherFeed = weather ? "live" : "down";
  state.airFeed = air ? "live" : "down";
  if (weather === null) {
    state.readings = [];
    state.lastUpdated = new Date().toLocaleTimeString();
    render();
    return;
  }
  state.readings = cleanJoined(weather, air);
  state.gapCount = state.readings.filter(function (row) {
    return row.flags.length > 0;
  }).length;
  state.lastUpdated = new Date().toLocaleTimeString();
  render();
  console.log("Pipeline ran. Readings:", state.readings.length, "Gaps:", state.gapCount);
}

runPipeline();
setInterval(runPipeline, 600000);
