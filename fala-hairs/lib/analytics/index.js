// lib/analytics/index.js
const fs = require('fs');
const path = require('path');

const ANALYTICS_FILE = path.join(__dirname, '../../data/analytics.json');

function readAnalytics() {
  try {
    return JSON.parse(fs.readFileSync(ANALYTICS_FILE, 'utf8'));
  } catch { return []; }
}

function writeAnalytics(data) {
  fs.writeFileSync(ANALYTICS_FILE, JSON.stringify(data, null, 2));
}

function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}

function trackVisit() {
  const data = readAnalytics();
  const today = getTodayStr();
  const idx = data.findIndex(d => d.date === today);
  if (idx >= 0) {
    data[idx].visits++;
  } else {
    data.push({ date: today, visits: 1, productViews: 0, whatsappClicks: 0 });
  }
  writeAnalytics(data);
}

function trackProductView() {
  const data = readAnalytics();
  const today = getTodayStr();
  const idx = data.findIndex(d => d.date === today);
  if (idx >= 0) {
    data[idx].productViews++;
  } else {
    data.push({ date: today, visits: 0, productViews: 1, whatsappClicks: 0 });
  }
  writeAnalytics(data);
}

function trackWhatsAppClick() {
  const data = readAnalytics();
  const today = getTodayStr();
  const idx = data.findIndex(d => d.date === today);
  if (idx >= 0) {
    data[idx].whatsappClicks++;
  } else {
    data.push({ date: today, visits: 0, productViews: 0, whatsappClicks: 1 });
  }
  writeAnalytics(data);
}

function getAnalytics(days = 7) {
  const data = readAnalytics();
  return data.slice(-days);
}

module.exports = { trackVisit, trackProductView, trackWhatsAppClick, getAnalytics };
