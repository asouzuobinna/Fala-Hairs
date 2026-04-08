// routes/auth.js
//
// ── Switching to bcrypt (production) ──────────────────────────────────────
// 1. npm install bcryptjs
// 2. Replace verifyPassword() body with:
//    return require('bcryptjs').compareSync(plain, stored);
// 3. Re-hash all passwords in admins.json:
//    node -e "const b=require('bcryptjs');console.log(b.hashSync('falahairs',12))"
// 4. Remove hashAlgo field from admins.json (no longer needed)
// ──────────────────────────────────────────────────────────────────────────

const express  = require('express');
const router   = express.Router();
const fs       = require('fs');
const path     = require('path');
const crypto   = require('crypto');   // built-in — no install needed
const { createOTP, verifyOTP, sendOTPEmail } = require('../lib/otp');
const { signToken } = require('../middleware/auth');

const ADMINS_FILE = path.join(__dirname, '../data/admins.json');

function readAdmins() {
  return JSON.parse(fs.readFileSync(ADMINS_FILE, 'utf8'));
}

// ── Password verification ──────────────────────────────────────────────────
// Currently: sha256 (crypto built-in, no npm)
// Production: swap the return for bcryptjs.compareSync(plain, stored)
function verifyPassword(plain, stored) {
  const hashed = crypto.createHash('sha256').update(plain).digest('hex');
  return hashed === stored;                  // ← swap this line for bcrypt
}

// ── Find admin by email ────────────────────────────────────────────────────
function findAdmin(email) {
  const db = readAdmins();
  const e  = email.toLowerCase().trim();
  if (db.supreme.email === e) return db.supreme;
  return db.subAdmins.find(a => a.email === e) || null;
}

// ─────────────────────────────────────────────────────────────────────────
// POST /api/auth/login  — step 1: email + password
// ─────────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const admin = findAdmin(email);

    // Deliberate: same error for unknown email vs wrong password (prevents enumeration)
    if (!admin || !verifyPassword(password, admin.passwordHash)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Sub-admins → token immediately
    if (admin.role !== 'supreme') {
      const token = signToken({ email: admin.email, name: admin.name, role: admin.role });
      res.cookie('adminToken', token, { httpOnly: true, sameSite: 'lax', maxAge: 8 * 60 * 60 * 1000 });
      return res.json({ success: true, token, role: admin.role, name: admin.name });
    }

    // Supreme → generate OTP and send
    const code   = createOTP(admin.email);
    const result = await sendOTPEmail(admin.email, admin.name, code);

    const response = {
      requiresOTP : true,
      email       : admin.email,
      sentTo      : admin.email,          // shown in UI
      expiresIn   : '10 minutes',
    };

    // Only include raw code in demo mode so the UI can display it
    if (result.demo) response.demoOTP = code;

    return res.json(response);

  } catch (err) {
    console.error('[auth/login]', err);
    res.status(500).json({ error: 'Server error — please try again' });
  }
});

// ─────────────────────────────────────────────────────────────────────────
// POST /api/auth/verify-otp  — step 2: OTP for supreme admin
// ─────────────────────────────────────────────────────────────────────────
router.post('/verify-otp', (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'Email and OTP are required' });

    const result = verifyOTP(email, otp);
    if (!result.valid) return res.status(401).json({ error: result.reason });

    const admin = findAdmin(email);
    const token = signToken({ email: admin.email, name: admin.name, role: admin.role });
    res.cookie('adminToken', token, { httpOnly: true, sameSite: 'lax', maxAge: 8 * 60 * 60 * 1000 });
    res.json({ success: true, token, role: admin.role, name: admin.name });

  } catch (err) {
    console.error('[auth/verify-otp]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─────────────────────────────────────────────────────────────────────────
// POST /api/auth/logout
// ─────────────────────────────────────────────────────────────────────────
router.post('/logout', (req, res) => {
  res.clearCookie('adminToken');
  res.json({ success: true });
});

module.exports = router;
