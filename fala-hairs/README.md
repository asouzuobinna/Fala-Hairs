# FALA Hairs — Luxury Ecommerce v3
**Fala Production Ltd © 2026**

## Quick Start
```bash
npm install
cp .env.example .env
node server.js
# → http://localhost:3000
# → http://localhost:3000/admin
```

## Admin Logins
| Role | Email | Password |
|------|-------|----------|
| **Supreme Admin** | admin@falahairs.com | falahairs |
| Sub-Admin 1 | agent1@falahairs.com | agent1pass |
| Sub-Admin 2 | agent2@falahairs.com | agent2pass |

> Supreme requires OTP after password (shown inline in demo mode).

## Admin Sections
| Section | Sub-Admin | Supreme |
|---------|-----------|---------|
| Dashboard | ✅ | ✅ |
| Listings | Edit only | Full CRUD + Bestseller |
| Lookbook | Add/Delete | Add/Delete |
| Analytics | ✅ | ✅ |
| Sub-Admins | ✗ | Full control |
| Activity Log | Own only | All |
| Settings | ✗ | Email, WhatsApp, Tagline |

## Media Rules
- **Cover** — required for every product listing
- **Extra photos** — optional, max 10, detail page only
- **Videos** — optional, max 5, 150MB each, detail page only
- **Lookbook images** — 1 per entry

## Product Pages
- Cards → Quick-View modal (cover only) → "View Full Details" → `/product/:id`
- Full detail page has media slideshow with thumbnails, length/colour/qty selector, WhatsApp order

## Bestseller
- Set by Supreme Admin only via Listings page
- Displayed on homepage hero with link to product page
