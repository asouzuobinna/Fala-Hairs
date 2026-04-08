// lib/otp/index.js
//
// ── Switching to real email ────────────────────────────────────────────────
// 1. npm install nodemailer
// 2. Set MAIL_HOST / MAIL_PORT / MAIL_USER / MAIL_PASS in .env
// 3. In sendOTPEmail() remove the "DEMO stub" block and uncomment nodemailer.
// generateOTP / createOTP / verifyOTP stay exactly the same.
// ──────────────────────────────────────────────────────────────────────────

const crypto = require('crypto');

const otpStore  = new Map();          // swap for Redis: client.setEx(key, 600, code)
const OTP_TTL   = 10 * 60 * 1000;    // 10 minutes
const MAX_TRIES = 5;

function generateOTP() {
  return String(crypto.randomInt(100000, 999999));   // cryptographically secure
}

function createOTP(email) {
  const code = generateOTP();
  otpStore.set(email.toLowerCase(), { code, expiresAt: Date.now() + OTP_TTL, attempts: 0 });
  return code;
}

function verifyOTP(email, input) {
  const key = email.toLowerCase();
  const rec = otpStore.get(key);
  if (!rec)                      return { valid: false, reason: 'No OTP found — please login again' };
  if (Date.now() > rec.expiresAt){ otpStore.delete(key); return { valid: false, reason: 'OTP expired — please login again' }; }
  if (rec.attempts >= MAX_TRIES) { otpStore.delete(key); return { valid: false, reason: 'Too many failed attempts' }; }
  rec.attempts++;
  if (rec.code !== String(input).trim()) return { valid: false, reason: `Incorrect code (${MAX_TRIES - rec.attempts} tries left)` };
  otpStore.delete(key);
  return { valid: true };
}

// ── Email delivery ─────────────────────────────────────────────────────────
async function sendOTPEmail(toEmail, adminName, code) {

  // ══ DEMO MODE — remove the 4 lines below for production ══════════════════
  console.log(`\n[FALA OTP] ${toEmail} → ${code}  (valid 10 min)\n`);
  return { demo: true, code };   // <─ remove this return in production
  // ══════════════════════════════════════════════════════════════════════════

  // ── PRODUCTION (nodemailer) — uncomment below: ────────────────────────────
  // const nodemailer = require('nodemailer');
  // const transport  = nodemailer.createTransport({
  //   host: process.env.MAIL_HOST,
  //   port: Number(process.env.MAIL_PORT) || 587,
  //   secure: false,
  //   auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
  // });
  // await transport.sendMail({
  //   from   : process.env.MAIL_FROM || 'FALA Hairs <noreply@falahairs.com>',
  //   to     : toEmail,
  //   subject: 'Your FALA Admin Login Code',
  //   html   : otpEmailHTML(adminName, code),
  // });
  // return { demo: false };
}

function otpEmailHTML(name, code) {
  return `<!DOCTYPE html><html><body style="margin:0;background:#f5f5f5;font-family:Georgia,serif">
  <div style="max-width:480px;margin:40px auto;background:#FAF6F0;border:1px solid #F5E6C8;border-radius:8px;overflow:hidden">
    <div style="background:#4A0E2B;padding:28px 32px">
      <div style="color:#F5E6C8;font-size:22px;font-weight:bold;letter-spacing:3px">FALA HAIRS</div>
      <div style="color:#C9A84C;font-size:10px;letter-spacing:4px;margin-top:4px">ADMIN PORTAL</div>
    </div>
    <div style="padding:36px 32px">
      <p style="color:#4A0E2B;font-size:16px;margin:0 0 8px">Hello, ${name}</p>
      <p style="color:#777;font-size:14px;margin:0 0 24px">Your one-time admin login code:</p>
      <div style="background:#4A0E2B;border-radius:6px;padding:26px;text-align:center;margin:0 0 24px">
        <span style="color:#C9A84C;font-size:40px;font-weight:bold;letter-spacing:16px;font-family:monospace">${code}</span>
      </div>
      <p style="color:#999;font-size:13px;margin:0 0 6px">⏱ Expires in <strong>10 minutes</strong></p>
      <p style="color:#999;font-size:13px;margin:0">🔒 Never share this code with anyone.</p>
    </div>
    <div style="background:#F5E6C8;padding:14px 32px;font-size:11px;color:#aaa;text-align:center">
      © 2026 Fala Production Ltd · If you did not request this, ignore this email.
    </div>
  </div></body></html>`;
}

module.exports = { createOTP, verifyOTP, sendOTPEmail };
