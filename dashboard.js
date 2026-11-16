const refreshBtn = document.getElementById("refreshBtn");
const updatedAt = document.getElementById("updatedAt");
refreshBtn.addEventListener("click", function () {
  const now = new Date();
  updatedAt.textContent = "Updated: " + now.toLocaleTimeString();
});

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
  setCard("temperature-card", "temperature-note", latest, "temperature", " °C");
  setCard("humidity-card", "humidity-note", latest, "humidity", " %");
  setCard("pm25-card", "pm25-note", latest, "pm25", "");
  setCard("pm10-card", "pm10-note", latest, "pm10", "");
  /* WIRING (brief section 3 W3 / 4.3(c)): the book prints no code for this joint. The air card's value span (#air-value) is wired here, after the four cards update, to the live PM2.5 reading from the pipeline's latest row, with the band word from the pickLine thresholds (Good / Moderate / Unhealthy for Sensitive Groups / Unhealthy / Very Unhealthy / Hazardous). */
  const airCard = document.getElementById("air-value");
  if (airCard && latest && latest.pm25 !== null) {
    let band = "Hazardous";
    if (latest.pm25 <= 50) { band = "Good"; }
    else if (latest.pm25 <= 100) { band = "Moderate"; }
    else if (latest.pm25 <= 150) { band = "Unhealthy for Sensitive Groups"; }
    else if (latest.pm25 <= 200) { band = "Unhealthy"; }
    else if (latest.pm25 <= 300) { band = "Very Unhealthy"; }
    airCard.textContent = latest.pm25 + " — " + band;
  }
  const summary = summarize(state.readings);
  const report = document.getElementById("gap-report");
  report.textContent = summary.hours + " hours, " + summary.validHours + " valid, " + summary.flaggedHours + " flagged, mean temperature " + summary.meanTemperature;
  updateSummaryPanel();
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

const summaryLines = {
  good: "Air quality is good. Outdoor activities are fine.",
  moderate: "Air quality is moderate. Sensitive groups should reduce long outdoor activity.",
  sensitive: "Air quality is unhealthy for sensitive groups. Sensitive groups should avoid long outdoor activity.",
  unhealthy: "Air quality is unhealthy. Everyone should reduce long outdoor activity.",
  veryUnhealthy: "Air quality is very unhealthy. Everyone should avoid long outdoor activity.",
  hazardous: "Air quality is hazardous. Stay indoors and keep windows closed."
};

function pickLine(aqi) {
  if (aqi <= 50) {
    return summaryLines.good;
  } else if (aqi <= 100) {
    return summaryLines.moderate;
  } else if (aqi <= 150) {
    return summaryLines.sensitive;
  } else if (aqi <= 200) {
    return summaryLines.unhealthy;
  } else if (aqi <= 300) {
    return summaryLines.veryUnhealthy;
  } else {
    return summaryLines.hazardous;
  }
}

const banned = ["cure", "safe for everyone", "guaranteed"];

function checkSummary(text, liveAqi) {
  for (const word of banned) {
    if (text.toLowerCase().includes(word)) {
      return "BLOCKED: banned word.";
    }
  }
  if (text.includes("40 percent") && liveAqi !== 40) {
    return "FLAGGED: number does not match.";
  }
  return "PASS";
}

/* Panel update (WIRING per brief 4.3(d) / section 3 W5): the book prints the panel rules but no update function. On each pipeline run, take the latest PM2.5 value as the live reading, pick the line with pickLine, run checkSummary, show the line on PASS, put a failed line in the review box and keep the old summary on screen. If the stream is down, show the line from the last good reading with the book's mock label, using state.lastUpdated. The words never change; only the numbers change, shown in the #summary-number span beside the line. */
function updateSummaryPanel() {
  const panel = document.getElementById("summary-panel");
  const updated = document.getElementById("summary-updated");
  const reviewBox = document.getElementById("review-box");
  const latest = state.readings[state.readings.length - 1];
  if (!latest || latest.pm25 === null) {
    panel.textContent = "Mock summary — stream offline, last reading " + state.lastUpdated;
    return;
  }
  const line = pickLine(latest.pm25);
  const check = checkSummary(line, latest.pm25);
  if (check !== "PASS") {
    const item = document.createElement("li");
    item.textContent = line + " — " + check;
    reviewBox.appendChild(item);
    return;
  }
  const offline = state.weatherFeed === "down" || state.airFeed === "down";
  panel.textContent = offline ? "Mock summary — stream offline, last reading " + state.lastUpdated + ": " + line : line;
  let number = document.getElementById("summary-number");
  if (!number) {
    number = document.createElement("span");
    number.id = "summary-number";
    panel.after(number);
  }
  number.textContent = "AQI " + latest.pm25 + ", temp " + latest.temperature + "C, humidity " + latest.humidity + "%";
  updated.textContent = "Last update: " + state.lastUpdated;
}

function cleanText(rawText) {
  let clean = rawText.replace(/[<>`]/g, "");
  clean = clean.trim();
  return clean;
}

function validateObservation(name, place, note, reading) {
  const errors = [];
  if (name.length < 2 || name.length > 40) {
    errors.push("Name must be 2 to 40 characters.");
  }
  if (/[0-9<>]/.test(name)) {
    errors.push("Name must hold letters and spaces only.");
  }
  if (note.length < 10 || note.length > 280) {
    errors.push("Note must be 10 to 280 characters.");
  }
  if (note.includes("<") || note.includes(">")) {
    errors.push("Note must not hold angle brackets.");
  }
  if (reading < 0 || reading > 500) {
    errors.push("Reading must be 0 to 500.");
  }
  return errors;
}

function sanitiseObservation(raw) {
  const clean = {};
  clean.name = cleanText(raw.name);
  clean.place = cleanText(raw.place);
  clean.note = cleanText(raw.note);
  clean.note = clean.note.replace(/javascript:/gi, "");
  clean.reading = Number(raw.reading);
  return clean;
}

function showObservation(clean) {
  const list = document.getElementById("observation-list");
  const item = document.createElement("li");
  const text = clean.place + " — " + clean.note +
    " (AQI " + clean.reading + ") by " + clean.name;
  item.textContent = text;
  list.appendChild(item);
}

function logBlockedAttempt(reason) {
  const time = new Date().toLocaleTimeString();
  const line = time + " — Blocked: " + reason;
  console.log(line);
  const logList = document.getElementById("blocked-log");
  const item = document.createElement("li");
  item.textContent = line;
  logList.appendChild(item);
}

const form = document.getElementById("observation-form");
form.addEventListener("submit", function (event) {
  event.preventDefault();
  const name = document.getElementById("observer-name").value;
  const place = document.getElementById("place").value;
  const note = document.getElementById("note").value;
  const reading = document.getElementById("aqi-reading").value;
  const errors = validateObservation(name, place, note, reading);
  if (errors.length > 0) {
    document.getElementById("form-message").textContent = errors[0];
    logBlockedAttempt(errors[0]);
    return;
  }
  const clean = sanitiseObservation({ name, place, note, reading });
  showObservation(clean);
  document.getElementById("form-message").textContent = "Observation saved.";
  form.reset();
});

function bytesToHex(buffer) {
  const bytes = new Uint8Array(buffer);
  let hex = "";
  for (const byte of bytes) {
    hex += byte.toString(16).padStart(2, "0");
  }
  return hex;
}

async function makeKey() {
  const key = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
  console.log("Key ready: " + key.type);
  console.log("Algorithm: " + key.algorithm.name);
  return key;
}

function bufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function base64ToBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function hashRecord(record) {
  const text = JSON.stringify(record);
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return bytesToHex(digest);
}

async function lockRecord(key, record) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new TextEncoder().encode(JSON.stringify(record));
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data);
  return { id: record.id, iv: bufferToBase64(iv), data: bufferToBase64(cipher), hash: await hashRecord(record) };
}

async function unlockRecord(key, locked) {
  try {
    const plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: new Uint8Array(base64ToBuffer(locked.iv)) },
      key,
      base64ToBuffer(locked.data)
    );
    const record = JSON.parse(new TextDecoder().decode(plain));
    if ((await hashRecord(record)) !== locked.hash) {
      return "Hash mismatch for " + record.id;
    }
    return record;
  } catch (error) {
    return "Could not unlock " + locked.id + ": " + error.message;
  }
}

function canDo(role, action) {
  const rules = {
    admin: ["read", "add", "edit", "readPrivate"],
    editor: ["read", "add", "edit"],
    viewer: ["read"]
  };
  const allowed = rules[role] || [];
  return allowed.includes(action);
}

const readings = [
  { id: "R1", sensor: "PM2.5", value: 12, note: "Morning reading" },
  { id: "R2", sensor: "Temperature", value: 21.4, note: "Shade sensor" },
  { id: "R3", sensor: "PM2.5", value: 18, note: "Afternoon reading" }
];

/* WIRING: store setup per 2.2 Solo steps 9-11. Runs once at page load. */
let storeKey = null;
const lockedStore = [];
async function setupStore() {
  storeKey = await makeKey();
  for (const record of readings) {
    const locked = await lockRecord(storeKey, record);
    lockedStore.push(locked);
  }
  localStorage.setItem("pulsegrid-locked", JSON.stringify(lockedStore));
  console.log("Stored records: " + lockedStore.length);
  document.getElementById("store-status").textContent = "Locked: " + lockedStore.length + " records";
}
setupStore();

/* WIRING: unlock button per 2.2 Bit-by-Bit steps 3-5. */
document.getElementById("unlockBtn").addEventListener("click", async function () {
  const role = document.getElementById("role-select").value;
  const list = document.getElementById("locked-list");
  list.innerHTML = "";
  if (!canDo(role, "read")) {
    document.getElementById("store-status").textContent = "Locked: your role cannot read these records.";
    return;
  }
  for (const locked of lockedStore) {
    const result = await unlockRecord(storeKey, locked);
    const item = document.createElement("li");
    if (typeof result === "string") {
      item.textContent = "Warning: " + result;
    } else {
      item.textContent = result.sensor + ": " + result.value + " — hash OK";
    }
    list.appendChild(item);
  }
  document.getElementById("store-status").textContent = "Unlocked: " + lockedStore.length + " records, hashes checked.";
});
