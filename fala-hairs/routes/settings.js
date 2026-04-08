// routes/settings.js
const express = require('express');
const router  = express.Router();
const fs      = require('fs');
const path    = require('path');
const { requireAuth, requireSupreme } = require('../middleware/auth');
const SETTINGS_FILE = path.join(__dirname, '../data/settings.json');

function read()      { try { return JSON.parse(fs.readFileSync(SETTINGS_FILE,'utf8')); } catch { return {}; } }
function write(data) { fs.writeFileSync(SETTINGS_FILE, JSON.stringify(data, null, 2)); }

// GET /api/settings  — public
router.get('/', (req, res) => res.json(read()));

// PUT /api/settings  — supreme only
router.put('/', requireSupreme, (req, res) => {
  const allowed = ['email','whatsapp','whatsappDisplay','bestsellerProductId','internationalDelivery','brandTagline'];
  const current = read();
  for (const k of allowed) {
    if (req.body[k] !== undefined) current[k] = req.body[k];
  }
  write(current);
  res.json(current);
});

module.exports = router;
