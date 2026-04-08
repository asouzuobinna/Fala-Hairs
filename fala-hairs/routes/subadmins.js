// routes/subadmins.js — Supreme Admin only
const express  = require('express');
const router   = express.Router();
const fs       = require('fs');
const path     = require('path');
const crypto   = require('crypto');
const { requireSupreme } = require('../middleware/auth');
const { logActivity }    = require('../lib/activityLogger');

const ADMINS_FILE = path.join(__dirname, '../data/admins.json');
function read()      { return JSON.parse(fs.readFileSync(ADMINS_FILE,'utf8')); }
function write(data) { fs.writeFileSync(ADMINS_FILE, JSON.stringify(data, null, 2)); }
function hashPw(pw)  { return crypto.createHash('sha256').update(pw).digest('hex'); }

// GET /api/subadmins
router.get('/', requireSupreme, (req, res) => {
  const db = read();
  res.json(db.subAdmins.map(a => ({ email: a.email, name: a.name, role: a.role })));
});

// POST /api/subadmins
router.post('/', requireSupreme, (req, res) => {
  const { email, name, password } = req.body;
  if (!email || !name || !password) return res.status(400).json({ error: 'email, name and password required' });
  const db = read();
  if (db.subAdmins.find(a => a.email === email.toLowerCase())) {
    return res.status(409).json({ error: 'Email already exists' });
  }
  const newAdmin = { email: email.toLowerCase(), name, passwordHash: hashPw(password), hashAlgo:'sha256', role:'sub' };
  db.subAdmins.push(newAdmin);
  write(db);
  logActivity('supreme', `Created sub-admin: ${name}`, email);
  res.status(201).json({ email: newAdmin.email, name: newAdmin.name, role: newAdmin.role });
});

// DELETE /api/subadmins/:email
router.delete('/:email', requireSupreme, (req, res) => {
  const db  = read();
  const target = decodeURIComponent(req.params.email);
  const before = db.subAdmins.length;
  db.subAdmins = db.subAdmins.filter(a => a.email !== target);
  if (db.subAdmins.length === before) return res.status(404).json({ error: 'Sub-admin not found' });
  write(db);
  logActivity('supreme', `Deleted sub-admin`, target);
  res.json({ success: true });
});

module.exports = router;
