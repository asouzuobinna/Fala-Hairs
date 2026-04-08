/* ═══════════════════════════════════════════════════════════════
   FALA HAIRS  v3.1  —  SPA
   Navbar is static in index.html — pages only render #app content
   Fala Production Ltd © 2026
═══════════════════════════════════════════════════════════════ */

/* ── CONSTANTS ──────────────────────────────────────────────── */
const COLOR_NAMES = {'1':'Jet Black','1B':'Natural Black','2':'Dark Brown','4':'Medium Brown','27':'Honey Blonde','613':'Platinum Blonde'};
const COLOR_HEX   = {'1':'#080404','1B':'#1A1008','2':'#3D2010','4':'#6B3A2A','27':'#C09040','613':'#F5E6A0'};
const ALL_COLORS  = Object.entries(COLOR_NAMES);

/* ── STATE ──────────────────────────────────────────────────── */
const S = {
  page:'home', productId:null,
  products:[], settings:{}, bestseller:null, lookbook:[],
  pdp:{ product:null, mediaIdx:0, length:null, color:null, qty:1 },
  mart:{ search:'', cat:'All' },
  admin:{
    token: safeLS('adminToken'), role: safeLS('adminRole'), name: safeLS('adminName'),
    section:'dashboard', otpEmail:null, otpSentTo:null, otpDemo:null, _pw:null
  },
};

function safeLS(k){ try{ return localStorage.getItem(k); }catch{ return null; } }
function lsSet(k,v){ try{ localStorage.setItem(k,v); }catch{} }
function lsDel(k)  { try{ localStorage.removeItem(k); }catch{} }

/* ── ROUTER ─────────────────────────────────────────────────── */
function nav(page, opts={}){
  S.page = page;
  if (opts.productId) S.productId = opts.productId;
  closeDrawer();
  closeModal();
  window.scrollTo({ top:0, behavior:'smooth' });
  syncNav();
  render();
  const url = page==='home' ? '/' : page==='product' ? `/product/${S.productId}` : `/${page}`;
  history.pushState({ page, ...opts }, '', url);
}
window.addEventListener('popstate', e => {
  S.page = e.state?.page || 'home';
  S.productId = e.state?.productId || null;
  syncNav(); render();
});

function syncNav(){
  // Show/hide the static navbar
  const nb = document.getElementById('navbar');
  if (!nb) return;
  nb.style.display = S.page === 'admin' ? 'none' : '';
  nb.classList.toggle('scrolled', window.scrollY > 60);
  document.querySelectorAll('.nav-link').forEach(el =>
    el.classList.toggle('active', el.dataset.page === S.page)
  );
}

window.addEventListener('scroll', () =>
  document.getElementById('navbar')?.classList.toggle('scrolled', window.scrollY > 60)
);

/* ── MOBILE DRAWER ──────────────────────────────────────────── */
function toggleDrawer(){
  document.getElementById('navDrawer')?.classList.toggle('open');
  document.getElementById('navBurger')?.classList.toggle('open');
}
function closeDrawer(){
  document.getElementById('navDrawer')?.classList.remove('open');
  document.getElementById('navBurger')?.classList.remove('open');
}

/* ── API ─────────────────────────────────────────────────────── */
async function api(method, url, body){
  const h = { 'Content-Type':'application/json' };
  if (S.admin.token) h['Authorization'] = `Bearer ${S.admin.token}`;
  try {
    const r = await fetch(url, {
      method, headers: h, credentials:'include',
      body: body ? JSON.stringify(body) : undefined
    });
    return await r.json();
  } catch { return { error:'Network error' }; }
}

function xhrUp(method, url, fd, barId, txtId){
  return new Promise(resolve => {
    const x = new XMLHttpRequest();
    x.open(method, url);
    if (S.admin.token) x.setRequestHeader('Authorization', `Bearer ${S.admin.token}`);
    x.withCredentials = true;
    x.upload.onprogress = e => {
      if (!e.lengthComputable) return;
      const pct = Math.round(e.loaded / e.total * 100);
      const b = document.getElementById(barId), t = document.getElementById(txtId);
      if (b) b.style.width = pct + '%';
      if (t) t.textContent = `Uploading… ${pct}%`;
    };
    x.onload  = () => { try { resolve(JSON.parse(x.responseText)); } catch { resolve({ error:'Parse error' }); } };
    x.onerror = () => resolve({ error:'Network error' });
    x.send(fd);
  });
}

/* ── TOAST ───────────────────────────────────────────────────── */
let _toastTimer;
function toast(msg, type='ok'){
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = `toast${type==='err' ? ' error' : ''}`;
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => t.className = 'toast hidden', 3600);
}

/* ── SVG HELPERS ─────────────────────────────────────────────── */
const PAL = {
  bodywave:     ['#3D2B1F','#6B4C3B','#C9A07A','#E8C870'],
  silkystraight:['#1A0A05','#3D2010','#7A4A2A','#D4A860'],
  deepwave:     ['#0D0608','#2A0D1A','#4A0E2B','#8B3A5C'],
  loosecurl:    ['#2A1505','#5A3015','#A06030','#D4B080'],
  kinkycoily:   ['#0A0A0A','#1A1A1A','#2A2A2A','#4A4A4A'],
  waterwave:    ['#1A0A00','#3A1A05','#7A3A10','#C07030'],
};
function getPal(id){
  const k = (id||'').toLowerCase().replace(/[^a-z]/g,'');
  for (const key of Object.keys(PAL)) if (k.startsWith(key.slice(0,4))) return PAL[key];
  return PAL.bodywave;
}
function hairSVG(id, sz=200){
  const c = getPal(id), u = (id||'x').replace(/[^a-z0-9]/gi,'') + sz;
  const dots = Array.from({length:8}, (_,i) =>
    `<circle cx="${60+i*12}" cy="${155+Math.sin(i)*8}" r="2" fill="${c[3]}" opacity="0.5"/>`
  ).join('');
  return `<svg width="${sz}" height="${sz}" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <defs><radialGradient id="rg${u}" cx="40%" cy="35%">
    <stop offset="0%" stop-color="${c[3]}" stop-opacity=".65"/>
    <stop offset="100%" stop-color="${c[0]}" stop-opacity="0"/>
  </radialGradient></defs>
  <circle cx="100" cy="100" r="98" fill="${c[0]}"/>
  <circle cx="100" cy="100" r="98" fill="url(#rg${u})"/>
  <path d="M40 130 Q60 60 100 50 Q140 40 160 80 Q180 120 150 160 Q120 200 80 180 Q40 160 40 130Z" fill="${c[1]}"/>
  <path d="M50 125 Q70 55 110 45 Q145 38 162 75" stroke="${c[2]}" stroke-width="8" fill="none" stroke-linecap="round"/>
  <path d="M55 135 Q75 65 115 55 Q148 46 165 82" stroke="${c[3]}" stroke-width="4" fill="none" stroke-linecap="round" opacity=".7"/>
  <path d="M45 140 Q65 70 105 60 Q138 50 158 86" stroke="#FAF6F0" stroke-width="2" fill="none" stroke-linecap="round" opacity=".3"/>
  ${dots}</svg>`;
}

function fmt(n){ return '₦' + Number(n).toLocaleString('en-NG'); }
function cdot(c){ return `<div class="cdot" style="background:${COLOR_HEX[c]||'#333'}" title="${COLOR_NAMES[c]||c}"></div>`; }
function initials(name){ return (name||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase(); }
function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

/* ═══════════════════════════════════════════════════════════════
   RENDER ROUTER
═══════════════════════════════════════════════════════════════ */
async function render(){
  syncNav();
  try {
    switch(S.page){
      case 'home':     await renderHome();     break;
      case 'mart':     await renderMart();     break;
      case 'product':  await renderPDP();      break;
      case 'lookbook': await renderLookbook(); break;
      case 'about':    renderAbout();          break;
      case 'admin':
        if (!S.admin.token) {
          document.getElementById('navbar').style.display = 'none';
          document.getElementById('app').innerHTML = loginHTML('credentials');
        } else {
          await renderAdmin();
        }
        break;
      default:         await renderHome();
    }
  } catch(err){
    console.error('render error:', err);
    document.getElementById('app').innerHTML =
      `<div style="padding:120px 20px;text-align:center;font-family:Georgia,serif">
        <div style="font-size:32px;margin-bottom:16px">⚠️</div>
        <div style="color:#4A0E2B;font-size:18px;margin-bottom:12px">Something went wrong</div>
        <div style="color:#888;font-size:13px;margin-bottom:24px">${esc(err.message)}</div>
        <button onclick="nav('home')" style="background:#4A0E2B;color:#fff;border:none;padding:12px 28px;cursor:pointer;font-family:Georgia,serif;border-radius:3px">Go Home</button>
      </div>`;
  }
}

/* ── FOOTER ──────────────────────────────────────────────────── */
function footerHTML(){
  const st = S.settings || {};
  const waNum  = (st.whatsapp || '').replace(/\D/g,'');
  const waLink = waNum ? `https://wa.me/${waNum}` : '#';
  const waLbl  = st.whatsappDisplay || 'Chat with us on WhatsApp';
  const email  = st.email || 'hello@falahairs.com';
  const tagline = st.brandTagline || 'Premium luxury hair extensions — delivered worldwide.';
  return `<footer class="footer"><div class="footer-inner">
    <div class="footer-top">
      <div>
        <div class="footer-brand-name">FALA HAIRS</div>
        <div class="footer-brand-sub">Fala Production Ltd</div>
        <p class="footer-p">${esc(tagline)}</p>
        <a href="${waLink}" target="_blank" rel="noopener" class="footer-wa">📲 ${esc(waLbl)}</a>
      </div>
      <div>
        <div class="footer-col-title">Navigate</div>
        <a class="footer-link" onclick="nav('home')">Home</a>
        <a class="footer-link" onclick="nav('mart')">The Mart</a>
        <a class="footer-link" onclick="nav('lookbook')">Lookbook</a>
        <a class="footer-link" onclick="nav('about')">About</a>
      </div>
      <div>
        <div class="footer-col-title">Contact</div>
        <span class="footer-link">📍 Lagos, Nigeria</span>
        <a href="${waLink}" target="_blank" rel="noopener" class="footer-link">📲 WhatsApp Orders</a>
        <a href="mailto:${esc(email)}" class="footer-link">✉️ ${esc(email)}</a>
        <span class="footer-link" style="color:#C9A84C;font-weight:700">🌍 International Delivery Available</span>
      </div>
    </div>
    <div class="footer-bottom">
      <span class="footer-copy">© 2026 Fala Production Ltd. All rights reserved.</span>
      <span class="footer-heart">Crafted with ♡ for Queens</span>
    </div>
  </div></footer>`;
}

/* ═══════════════════════════════════════════════════════════════
   HOME
═══════════════════════════════════════════════════════════════ */
async function renderHome(){
  const app = document.getElementById('app');
  // Show loading state instantly
  app.innerHTML = `<div style="min-height:100svh;background:linear-gradient(150deg,#0D0608 0%,#4A0E2B 55%,#1A0510 100%)"></div>`;

  const [products, settings, bestseller] = await Promise.all([
    api('GET','/api/products').then(r => Array.isArray(r) ? r : []),
    api('GET','/api/settings').then(r => r.error ? {} : r),
    api('GET','/api/products/bestseller').then(r => (r && !r.error) ? r : null),
  ]);
  S.products = products; S.settings = settings; S.bestseller = bestseller;

  const bsMedia = bestseller?.cover
    ? `<img src="/uploads/products/${esc(bestseller.cover)}" alt="${esc(bestseller.name)}" style="width:100%;height:100%;object-fit:cover;border-radius:50%" onerror="this.style.display='none'">`
    : hairSVG('bodywave20', 240);

  app.innerHTML = `
  <section class="hero">
    <div class="hero-orb1"></div><div class="hero-orb2"></div>
    <div class="hero-inner">
      <div class="fu">
        <span class="hero-eyebrow">✦ Luxury Hair Extensions ✦</span>
        <h1 class="hero-h1">Born for<br><em>Queens</em><br>Who Reign</h1>
        <p class="hero-p">Premium human hair — meticulously curated, ethically sourced, and crafted for women who demand nothing less than extraordinary.</p>
        <div class="intl-badge">🌍 International Delivery Available</div>
        <div class="hero-btns">
          <button class="btn btn-gold btn-lg" onclick="nav('mart')">Explore Collection</button>
          <button class="btn btn-ghost btn-lg" onclick="nav('lookbook')">View Lookbook</button>
        </div>
        <div class="hero-stats">
          <div><div class="hs-num">100%</div><div class="hs-lbl">Human Hair</div></div>
          <div><div class="hs-num">500+</div><div class="hs-lbl">Happy Queens</div></div>
          <div><div class="hs-num">5★</div><div class="hs-lbl">Reviews</div></div>
          <div><div class="hs-num">🌍</div><div class="hs-lbl">Worldwide</div></div>
        </div>
      </div>
      <div class="hero-visual fu2">
        <div class="hero-circle" ${bestseller ? `onclick="nav('product',{productId:'${esc(bestseller.id)}'})" style="cursor:pointer"` : ''}>
          ${bsMedia}
          ${bestseller ? `<div class="hero-badge" onclick="nav('product',{productId:'${esc(bestseller.id)}'})">★ BESTSELLER →</div>` : ''}
        </div>
      </div>
    </div>
    <div class="scroll-hint"><span class="scroll-hint-txt">Scroll</span><div class="scroll-hint-line"></div></div>
  </section>

  <div class="marquee"><div class="marquee-track">
    <span class="marquee-item">✦ PREMIUM HUMAN HAIR</span>
    <span class="marquee-item">✦ SAME DAY DISPATCH</span>
    <span class="marquee-item">✦ AUTHENTIC &amp; ETHICAL</span>
    <span class="marquee-item">✦ WORLDWIDE DELIVERY</span>
    <span class="marquee-item">✦ PREMIUM HUMAN HAIR</span>
    <span class="marquee-item">✦ SAME DAY DISPATCH</span>
    <span class="marquee-item">✦ AUTHENTIC &amp; ETHICAL</span>
    <span class="marquee-item">✦ WORLDWIDE DELIVERY</span>
  </div></div>

  <section class="section"><div class="section-inner">
    <div class="section-hd"><span class="eyebrow">— Handpicked for You —</span><h2 class="section-title">The Crown Collection</h2></div>
    <div class="pgrid">${products.slice(0,4).map((p,i) => pcardHTML(p, i*.08)).join('')}</div>
    <div style="text-align:center;margin-top:32px">
      <button class="btn btn-gold btn-lg" onclick="nav('mart')">View Full Collection</button>
    </div>
  </div></section>

  <div class="dark-section"><div class="section-inner">
    <div class="section-hd"><span class="eyebrow">— The FALA Difference —</span><h2 class="section-title section-title-lt">Why Queens Choose Us</h2></div>
    <div class="features-grid">
      <div class="feat-card"><div class="feat-icon">👑</div><div class="feat-title">100% Authentic</div><div class="feat-desc">Every bundle is genuine human hair, ethically sourced and verified for purity.</div></div>
      <div class="feat-card"><div class="feat-icon">🌹</div><div class="feat-title">Luxury Curated</div><div class="feat-desc">Hand-selected textures meeting FALA's uncompromising premium standard.</div></div>
      <div class="feat-card"><div class="feat-icon">🌍</div><div class="feat-title">Ships Worldwide</div><div class="feat-desc">We deliver internationally — wherever you are, your crown finds you.</div></div>
      <div class="feat-card"><div class="feat-icon">💬</div><div class="feat-title">White-Glove Support</div><div class="feat-desc">Personal WhatsApp consultation to match your perfect look.</div></div>
    </div>
  </div></div>

  <section class="section"><div class="section-inner">
    <div class="section-hd"><span class="eyebrow">— Real Queens, Real Reviews —</span><h2 class="section-title">What They're Saying</h2></div>
    <div class="tgrid">
      <div class="tcard"><div class="t-stars">★★★★★</div><p class="t-text">"The body wave bundle from FALA is absolutely divine. The quality is unmatched — still lustrous after 3 months!"</p><div class="t-name">Adaeze O.</div><div class="t-loc">Lagos</div></div>
      <div class="tcard"><div class="t-stars">★★★★★</div><p class="t-text">"Finally found my go-to hair brand. FALA's customer service is exceptional and the hair speaks for itself."</p><div class="t-name">Chioma B.</div><div class="t-loc">Abuja</div></div>
      <div class="tcard"><div class="t-stars">★★★★★</div><p class="t-text">"The silky straight is the most natural-looking hair I've ever worn. I get compliments everywhere I go!"</p><div class="t-name">Funmi A.</div><div class="t-loc">Port Harcourt</div></div>
    </div>
  </div></section>

  <div class="cta-banner">
    <span class="eyebrow">Ready to elevate?</span>
    <h2>Your Crown Awaits</h2>
    <button class="btn btn-gold btn-lg" onclick="nav('mart')">Shop The Collection</button>
  </div>

  ${footerHTML()}`;
}

/* ── PRODUCT CARD ─────────────────────────────────────────────── */
function pcardHTML(p, delay=0){
  const img = p.cover
    ? `<img src="/uploads/products/${esc(p.cover)}" alt="${esc(p.name)}" loading="lazy"
         onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
       <div class="pcard-svg" style="display:none">${hairSVG(p.id, 130)}</div>`
    : `<div class="pcard-svg">${hairSVG(p.id, 130)}</div>`;
  return `<div class="pcard" style="animation-delay:${delay}s" onclick="openQuickView('${esc(p.id)}')">
    <div class="pcard-img">
      ${img}
      ${p.tag ? `<div class="ptag">${esc(p.tag)}</div>` : ''}
      ${p.availability==='limited' ? `<div class="ptag-lim">Limited</div>` : ''}
    </div>
    <div class="pcard-info">
      <div class="pcard-cat">${esc(p.category)} · ${esc(p.texture)}</div>
      <div class="pcard-name">${esc(p.name)}</div>
      <div class="pcard-row">
        <div class="pcard-price">${fmt(p.price)}</div>
        <div class="cdots">${(p.colors||[]).slice(0,4).map(cdot).join('')}</div>
      </div>
      <button class="btn btn-gold" onclick="event.stopPropagation();openQuickView('${esc(p.id)}')">Quick View</button>
    </div>
  </div>`;
}

/* ── QUICK VIEW MODAL ─────────────────────────────────────────── */
async function openQuickView(id){
  const p = S.products.find(x => x.id === id) || await api('GET', `/api/products/${id}`);
  if (!p || p.error){ toast('Product not found','err'); return; }
  const cover = p.cover
    ? `<img src="/uploads/products/${esc(p.cover)}" alt="${esc(p.name)}" style="width:100%;height:100%;object-fit:cover"
         onerror="this.style.display='none'">`
    : `<div class="modal-cover-svg">${hairSVG(p.id, 200)}</div>`;

  document.getElementById('modalContent').innerHTML = `
    <div class="modal-drag"></div>
    <div class="modal-cover">${cover}${p.tag ? `<div class="ptag" style="top:12px;left:12px">${esc(p.tag)}</div>` : ''}</div>
    <div class="modal-body">
      <div class="modal-cat">${esc(p.category)} · ${esc(p.texture)}</div>
      <div class="modal-name">${esc(p.name)}</div>
      <div class="modal-price">${fmt(p.price)}</div>
      <div class="modal-quick-info">
        <div class="mqi-item">📏 ${(p.lengths||[]).join('" · ')}"</div>
        <div class="mqi-item">🎨 ${(p.colors||[]).length} colours</div>
        <div class="mqi-item">${p.availability==='limited' ? '⚠️ Limited' : '✅ In Stock'}</div>
      </div>
    </div>
    <div class="modal-actions">
      <button class="btn btn-gold btn-full" onclick="closeModal();nav('product',{productId:'${esc(p.id)}'})">
        View Full Details &amp; Order →
      </button>
      <button class="btn btn-outline btn-full" onclick="closeModal()">Continue Browsing</button>
    </div>`;
  document.getElementById('modalOv').classList.remove('hidden');
}
function closeModal(){ document.getElementById('modalOv').classList.add('hidden'); }

/* ═══════════════════════════════════════════════════════════════
   PRODUCT DETAIL PAGE
═══════════════════════════════════════════════════════════════ */
async function renderPDP(){
  const app = document.getElementById('app');
  app.innerHTML = `<div style="padding:100px 20px;text-align:center;min-height:60vh;display:flex;align-items:center;justify-content:center"><div style="opacity:.4;font-size:20px">Loading…</div></div>`;

  if (!S.settings.whatsapp) S.settings = await api('GET','/api/settings').then(r => r.error ? {} : r);
  const p = await api('GET', `/api/products/${S.productId}`);
  if (!p || p.error){
    app.innerHTML = `<div class="empty-state" style="padding-top:120px">
      <div class="empty-icon">🔍</div><div class="empty-title">Product not found</div>
      <button class="btn btn-gold btn-md" style="margin-top:20px" onclick="nav('mart')">Back to Mart</button>
    </div>${footerHTML()}`;
    return;
  }

  S.pdp = { product:p, mediaIdx:0, length:p.lengths?.[0]||18, color:p.colors?.[0]||'1B', qty:1 };
  buildPDPHTML();
}

function buildSlides(p){
  const s = [];
  if (p.cover)  s.push({ type:'image', src:`/uploads/products/${p.cover}` });
  (p.images||[]).forEach(f => s.push({ type:'image', src:`/uploads/products/${f}` }));
  (p.videos||[]).forEach(f => s.push({ type:'video', src:`/uploads/videos/${f}` }));
  return s;
}

function buildPDPHTML(){
  const p = S.pdp.product;
  const app = document.getElementById('app');
  const slides = buildSlides(p);
  const idx = Math.min(S.pdp.mediaIdx, Math.max(slides.length-1, 0));

  let mainMedia;
  if (!slides.length){
    mainMedia = `<div style="aspect-ratio:1/1;display:flex;align-items:center;justify-content:center;
      background:linear-gradient(135deg,rgba(74,14,43,.07),rgba(13,6,8,.1))">${hairSVG(p.id,300)}</div>`;
  } else {
    const cur = slides[idx];
    const mainEl = cur.type==='video'
      ? `<video class="pdp-main-video" src="${cur.src}" controls playsinline></video>`
      : `<img class="pdp-main-img" src="${cur.src}" alt="${esc(p.name)}" onerror="this.style.background='#111'"/>`;
    const prev = slides.length>1 ? `<button class="pdp-nav-btn pdp-nav-prev" onclick="pdpShift(-1)">‹</button>` : '';
    const next = slides.length>1 ? `<button class="pdp-nav-btn pdp-nav-next" onclick="pdpShift(1)">›</button>`  : '';
    const ctr  = slides.length>1 ? `<div class="pdp-counter">${idx+1}/${slides.length}</div>` : '';
    const thumbRow = slides.length > 1 ? `<div class="pdp-thumbs">${slides.map((s,i) => {
      const t = s.type==='video'
        ? `<div class="pdp-thumb-vid">▶</div>`
        : `<img src="${s.src}" alt="" loading="lazy" onerror="this.style.display='none'"/>`;
      return `<div class="pdp-thumb ${i===idx?'active':''}" onclick="pdpGo(${i})">${t}</div>`;
    }).join('')}</div>` : '';
    mainMedia = `<div class="pdp-media">
      <div style="position:relative">${mainEl}${prev}${next}${ctr}</div>
      ${thumbRow}
    </div>`;
  }

  const lenBtns = (p.lengths||[]).map(l =>
    `<button class="len-btn ${S.pdp.length===l?'active':''}" onclick="pdpLen(${l})">${l}"</button>`
  ).join('');
  const swatches = (p.colors||[]).map(c =>
    `<div class="cswatch ${S.pdp.color===c?'active':''}" style="background:${COLOR_HEX[c]||'#333'}"
      title="${COLOR_NAMES[c]||c}" onclick="pdpCol('${c}')"></div>`
  ).join('');

  app.innerHTML = `
  <div class="pdp">
    <div class="pdp-layout">
      ${mainMedia}
      <div class="pdp-info">
        <div style="margin-bottom:12px">
          <a onclick="nav('mart')" style="font-size:12px;color:var(--gold);cursor:pointer;text-decoration:none;letter-spacing:1px;font-family:'Playfair Display',serif">← Back to Mart</a>
        </div>
        <div class="pdp-cat">${esc(p.category)} · ${esc(p.texture)}</div>
        <div class="pdp-name">${esc(p.name)}</div>
        <div class="pdp-price">${fmt(p.price)}</div>
        ${p.description ? `<div class="pdp-desc">${esc(p.description)}</div>` : ''}

        <span class="opt-label">Length</span>
        <div class="len-btns">${lenBtns}</div>

        <span class="opt-label">Colour: <strong style="color:var(--burg);text-transform:none;letter-spacing:0">${COLOR_NAMES[S.pdp.color]||S.pdp.color}</strong></span>
        <div class="color-swatches">${swatches}</div>

        <span class="opt-label">Quantity</span>
        <div class="qty-row">
          <button class="qty-btn" onclick="pdpQty(-1)">−</button>
          <span class="qty-num" id="pdpQtyNum">${S.pdp.qty}</span>
          <button class="qty-btn" onclick="pdpQty(1)">+</button>
        </div>

        <div class="pdp-total">Total: <strong id="pdpTotal">${fmt(p.price * S.pdp.qty)}</strong></div>
        <div class="pdp-actions">
          <button class="btn btn-wa btn-full" onclick="pdpOrder()">📲 Order via WhatsApp</button>
        </div>
        <div class="stock-note">
          ${p.availability==='limited' ? '⚠️ Limited stock — order now' : '✅ In Stock · Same-day dispatch · 🌍 Worldwide delivery'}
        </div>
      </div>
    </div>
  </div>
  ${footerHTML()}`;
}

function pdpShift(d){ const len=buildSlides(S.pdp.product).length; S.pdp.mediaIdx=(S.pdp.mediaIdx+d+len)%len; buildPDPHTML(); }
function pdpGo(i)   { S.pdp.mediaIdx=i; buildPDPHTML(); }
function pdpLen(l)  { S.pdp.length=l; buildPDPHTML(); }
function pdpCol(c)  { S.pdp.color=c; buildPDPHTML(); }
function pdpQty(d)  {
  S.pdp.qty = Math.max(1, S.pdp.qty + d);
  const n = document.getElementById('pdpQtyNum'), t = document.getElementById('pdpTotal');
  if (n) n.textContent = S.pdp.qty;
  if (t) t.textContent = fmt(S.pdp.product.price * S.pdp.qty);
}
async function pdpOrder(){
  const p = S.pdp.product;
  const res = await api('POST', `/api/products/${p.id}/whatsapp`, { length:S.pdp.length, color:S.pdp.color, quantity:S.pdp.qty });
  if (res.url) window.open(res.url, '_blank');
}

/* ═══════════════════════════════════════════════════════════════
   MART
═══════════════════════════════════════════════════════════════ */
async function renderMart(){
  const app = document.getElementById('app');
  if (!S.settings.email) S.settings = await api('GET','/api/settings').then(r => r.error ? {} : r);

  // Load all cats first (unfiltered), then filtered
  const [allProds] = await Promise.all([
    api('GET','/api/products').then(r => Array.isArray(r) ? r : [])
  ]);
  const cats = ['All', ...new Set(allProds.map(p => p.category))];

  const params = new URLSearchParams();
  if (S.mart.cat && S.mart.cat !== 'All') params.set('category', S.mart.cat);
  if (S.mart.search) params.set('search', S.mart.search);
  S.products = await api('GET', `/api/products?${params}`).then(r => Array.isArray(r) ? r : []);

  app.innerHTML = `
  <div style="padding-top:60px">
    <div class="page-hero">
      <span class="eyebrow">The FALA Collection</span>
      <h1>The Mart</h1>
      <p>Every texture. Every length. Your perfect crown.</p>
    </div>
    <section class="section"><div class="section-inner">
      <div class="filter-bar">
        <div class="search-wrap">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input class="search-input" id="searchIn" placeholder="Search textures, styles…"
            value="${esc(S.mart.search)}" oninput="martSearch(this.value)"/>
        </div>
        <div class="filter-pills">${cats.map(c =>
          `<button class="fpill ${S.mart.cat===c?'active':''}" onclick="martCat('${esc(c)}')">${esc(c)}</button>`
        ).join('')}</div>
      </div>
      <div class="results-count" id="rcount">Showing ${S.products.length} piece${S.products.length!==1?'s':''}</div>
      <div class="pgrid" id="pgrid">
        ${S.products.length
          ? S.products.map((p,i) => pcardHTML(p, i*.04)).join('')
          : `<div class="empty-state" style="grid-column:1/-1">
               <div class="empty-icon">🔍</div>
               <div class="empty-title">No results found</div>
               <div class="empty-sub">Try a different search or filter</div>
             </div>`}
      </div>
    </div></section>
    ${footerHTML()}
  </div>`;
}

let _sd;
function martSearch(v){
  S.mart.search = v;
  clearTimeout(_sd);
  _sd = setTimeout(async () => {
    const params = new URLSearchParams();
    if (S.mart.cat && S.mart.cat !== 'All') params.set('category', S.mart.cat);
    if (v) params.set('search', v);
    S.products = await api('GET', `/api/products?${params}`).then(r => Array.isArray(r) ? r : []);
    const g  = document.getElementById('pgrid');
    const rc = document.getElementById('rcount');
    if (g)  g.innerHTML = S.products.length
      ? S.products.map((p,i) => pcardHTML(p, i*.04)).join('')
      : `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">🔍</div><div class="empty-title">No results</div></div>`;
    if (rc) rc.textContent = `Showing ${S.products.length} piece${S.products.length!==1?'s':''}`;
  }, 280);
}
async function martCat(c){ S.mart.cat = c; await renderMart(); }

/* ═══════════════════════════════════════════════════════════════
   LOOKBOOK
═══════════════════════════════════════════════════════════════ */
async function renderLookbook(){
  const app = document.getElementById('app');
  if (!S.settings.email) S.settings = await api('GET','/api/settings').then(r => r.error ? {} : r);
  S.lookbook = await api('GET','/api/lookbook').then(r => Array.isArray(r) ? r : []);

  const items = S.lookbook.map((l,i) => `
  <div class="lb-item" onclick="nav('mart')">
    ${l.image
      ? `<img class="lb-img" src="/uploads/lookbook/${esc(l.image)}" alt="${esc(l.title)}" loading="lazy" onerror="this.style.display='none'">`
      : `<div class="lb-svg">${hairSVG('bodywave'+i, 140)}</div>`}
    <div class="lb-info">
      <div class="lb-num">Look ${String(i+1).padStart(2,'0')}</div>
      <div class="lb-title">${esc(l.title)}</div>
      ${l.description ? `<div class="lb-desc">${esc(l.description)}</div>` : ''}
    </div>
  </div>`).join('');

  app.innerHTML = `
  <div style="padding-top:60px">
    <div class="page-hero">
      <span class="eyebrow">Visual Stories</span>
      <h1>The Lookbook</h1>
      <p>Every texture tells a story. Find yours.</p>
    </div>
    <section class="section"><div class="section-inner">
      ${S.lookbook.length
        ? `<div class="lb-grid">${items}</div>
           <div style="text-align:center;margin-top:32px">
             <button class="btn btn-gold btn-lg" onclick="nav('mart')">Shop These Looks</button>
           </div>`
        : `<div class="empty-state">
             <div class="empty-icon">📷</div>
             <div class="empty-title">Lookbook coming soon</div>
             <div class="empty-sub">Check back for curated looks</div>
           </div>`}
    </div></section>
    ${footerHTML()}
  </div>`;
}

/* ═══════════════════════════════════════════════════════════════
   ABOUT
═══════════════════════════════════════════════════════════════ */
function renderAbout(){
  const app = document.getElementById('app');
  if (!S.settings.email) api('GET','/api/settings').then(r => { if (!r.error) S.settings = r; });
  const waNum  = (S.settings.whatsapp||'').replace(/\D/g,'');
  const waLink = waNum ? `https://wa.me/${waNum}` : '#';
  const email  = S.settings.email || 'hello@falahairs.com';

  app.innerHTML = `
  <div style="padding-top:60px">
    <div class="page-hero"><span class="eyebrow">Our Story</span><h1>About FALA</h1></div>
    <section class="section"><div class="section-inner">
      <div style="max-width:700px;margin:0 auto;text-align:center">
        <div class="about-logo-ring">
          <svg width="120" height="132" viewBox="0 0 100 110" fill="none">
            <circle cx="50" cy="48" r="46" stroke="#F2C4C4" stroke-width="3.5" fill="none" stroke-dasharray="260 25" stroke-linecap="round"/>
            <circle cx="50" cy="48" r="35" fill="#4A0E2B"/>
            <text x="50" y="62" text-anchor="middle" fill="white" font-size="36" font-family="Georgia,serif" font-weight="bold">fl</text>
            <circle cx="83" cy="82" r="5.5" fill="#4A0E2B"/>
            <text x="50" y="104" text-anchor="middle" fill="#F2C4C4" font-size="6.5" font-family="'Playfair Display',serif" font-weight="700" letter-spacing="2">FALA PRODUCTION LTD</text>
          </svg>
        </div>
        <span class="eyebrow" style="margin-bottom:16px">Fala Production Ltd</span>
        <h2 class="section-title" style="margin-bottom:20px">Born from a Vision of Luxury</h2>
        <p style="font-size:16px;line-height:1.9;color:#555;margin-bottom:16px">FALA Hairs was founded on a singular belief: every woman deserves to feel extraordinary. What began as a passion for authentic, premium hair extensions has grown into one of Nigeria's most trusted luxury hair brands.</p>
        <p style="font-size:16px;line-height:1.9;color:#555;margin-bottom:16px">We source only the finest human hair from ethical suppliers, curate textures that celebrate femininity in all its forms, and deliver a shopping experience worthy of royalty.</p>
        <p style="font-size:16px;line-height:1.9;color:#555">FALA Production Ltd stands behind every bundle, closure, and frontal — and now ships to queens worldwide.</p>
        <div class="intl-badge" style="margin:28px auto">🌍 International Delivery Available</div>
        <div class="about-stats-grid">
          <div><div class="astat-num">2019</div><div class="astat-lbl">Founded</div></div>
          <div><div class="astat-num">500+</div><div class="astat-lbl">Queens Served</div></div>
          <div><div class="astat-num">100%</div><div class="astat-lbl">Human Hair</div></div>
          <div><div class="astat-num">🌍</div><div class="astat-lbl">Worldwide</div></div>
        </div>
      </div>
    </div></section>
    <div class="dark-section" style="text-align:center"><div class="section-inner">
      <span class="eyebrow">Connect with Us</span>
      <h2 class="section-title section-title-lt" style="margin:12px 0 24px">Reach the FALA Family</h2>
      <div style="display:flex;gap:14px;justify-content:center;flex-wrap:wrap">
        <a href="${waLink}" target="_blank" rel="noopener" class="btn btn-wa btn-lg">📲 WhatsApp Us</a>
        <a href="mailto:${esc(email)}" class="btn btn-ghost btn-lg">✉️ Email Us</a>
      </div>
    </div></div>
    ${footerHTML()}
  </div>`;
}

/* ═══════════════════════════════════════════════════════════════
   ADMIN LOGIN
═══════════════════════════════════════════════════════════════ */
function loginHTML(step='credentials'){
  const masked = (S.admin.otpSentTo||'').replace(/(.{2}).+(@.+)/, '$1•••$2');

  const creds = `
    <div class="af-group">
      <label class="af-label">Email Address</label>
      <input id="lEmail" class="af-input" type="email" placeholder="admin@falahairs.com" autocomplete="email"/>
    </div>
    <div class="af-group">
      <label class="af-label">Password</label>
      <div class="pw-wrap">
        <input id="lPw" class="af-input" type="password" placeholder="••••••••"
          autocomplete="current-password" onkeydown="if(event.key==='Enter')doLogin()"/>
        <button class="pw-toggle" type="button" onclick="togglePw()">👁</button>
      </div>
    </div>
    <button class="btn btn-gold btn-full btn-lg" id="lBtn" onclick="doLogin()" style="margin-top:4px">Continue →</button>
    <div class="demo-hint"><strong>Supreme:</strong> admin@falahairs.com / falahairs<br><strong>Sub-Admin:</strong> agent1@falahairs.com / agent1pass</div>`;

  const otp = `
    <div class="otp-screen">
      <div class="otp-icon">📬</div>
      <div class="otp-title">Check your email</div>
      <div class="otp-sub">We sent a 6-digit code to<br><strong style="color:#4A0E2B">${masked}</strong><br><small style="color:#aaa">Expires in 10 minutes</small></div>
      ${S.admin.otpDemo ? `<div class="otp-demo-box">
        <div style="font-size:11px;color:#999">Demo mode — your code:</div>
        <div style="font-size:26px;color:#4A0E2B;letter-spacing:10px;font-family:monospace;font-weight:700;margin-top:4px">${S.admin.otpDemo}</div>
      </div>` : ''}
    </div>
    <div class="af-group">
      <label class="af-label" style="text-align:center">Verification Code</label>
      <input id="otpIn" class="otp-input" type="text" inputmode="numeric" pattern="[0-9]*"
        maxlength="6" placeholder="——————"
        onkeydown="if(event.key==='Enter')doOTP()"
        oninput="this.value=this.value.replace(/[^0-9]/g,'');if(this.value.length===6)doOTP()"/>
    </div>
    <button class="btn btn-gold btn-full btn-lg" id="otpBtn" onclick="doOTP()">Verify &amp; Sign In</button>
    <button onclick="showLoginStep('credentials')" style="width:100%;padding:12px;margin-top:10px;background:none;border:none;color:var(--gold);cursor:pointer;font-size:13px;text-decoration:underline;font-family:'Playfair Display',serif">← Different account</button>
    <div style="text-align:center;margin-top:10px;font-size:12px;color:#bbb">Didn't get it? <a onclick="resendOTP()" style="color:var(--gold);cursor:pointer;text-decoration:underline">Resend</a></div>`;

  return `<div class="login-page"><div class="login-card">
    <div class="login-hd">
      <svg width="52" height="57" viewBox="0 0 100 110" fill="none"><circle cx="50" cy="48" r="46" stroke="#F2C4C4" stroke-width="3.5" fill="none" stroke-dasharray="260 25" stroke-linecap="round"/><circle cx="50" cy="48" r="35" fill="#4A0E2B"/><text x="50" y="62" text-anchor="middle" fill="white" font-size="36" font-family="Georgia,serif" font-weight="bold">fl</text><circle cx="83" cy="82" r="5.5" fill="#4A0E2B"/></svg>
      <div class="login-title">Admin Portal</div>
      <div class="login-sub">FALA Production Ltd</div>
    </div>
    <div id="loginBody">${step==='otp' ? otp : creds}</div>
  </div></div>`;
}

function showLoginStep(s){ document.getElementById('app').innerHTML = loginHTML(s); }
function togglePw(){ const i=document.getElementById('lPw'); if(i) i.type = i.type==='password'?'text':'password'; }

function shake(el){
  if(!el) return;
  el.style.animation='none'; el.style.borderColor='#b71c1c';
  setTimeout(()=>{ el.style.animation='shake .35s ease'; setTimeout(()=>{ el.style.animation=''; el.style.borderColor=''; },400); },10);
}

async function doLogin(){
  const emailEl = document.getElementById('lEmail');
  const pwEl    = document.getElementById('lPw');
  const email   = emailEl?.value?.trim();
  const pw      = pwEl?.value;
  if (!email || !pw){ shake(pwEl||emailEl); toast('Enter your email and password','err'); return; }

  const btn = document.getElementById('lBtn');
  if (btn){ btn.disabled=true; btn.textContent='Verifying…'; }
  const res = await api('POST', '/api/auth/login', { email, password:pw });
  if (btn){ btn.disabled=false; btn.textContent='Continue →'; }

  if (res.error){ shake(pwEl); if(pwEl) pwEl.value=''; toast(res.error,'err'); return; }
  if (res.token){ setAdminSession(res); toast(`Welcome, ${res.name}!`); await renderAdmin(); return; }
  if (res.requiresOTP){
    S.admin.otpEmail  = res.email;
    S.admin.otpSentTo = res.sentTo;
    S.admin.otpDemo   = res.demoOTP || null;
    S.admin._pw       = pw;
    showLoginStep('otp');
    setTimeout(() => document.getElementById('otpIn')?.focus(), 80);
    return;
  }
  toast('Unexpected error — please try again','err');
}

async function doOTP(){
  const el  = document.getElementById('otpIn');
  const otp = el?.value?.trim();
  if (!otp || otp.length < 6){ shake(el); toast('Enter the full 6-digit code','err'); return; }

  const btn = document.getElementById('otpBtn');
  if (btn){ btn.disabled=true; btn.textContent='Verifying…'; }
  const res = await api('POST', '/api/auth/verify-otp', { email:S.admin.otpEmail, otp });
  if (btn){ btn.disabled=false; btn.textContent='Verify & Sign In'; }

  if (res.error){ shake(el); if(el) el.value=''; toast(res.error,'err'); return; }
  setAdminSession(res); S.admin.otpDemo=null;
  toast(`Welcome, ${res.name}! 👑`); await renderAdmin();
}

async function resendOTP(){
  if (!S.admin.otpEmail || !S.admin._pw){ showLoginStep('credentials'); return; }
  const res = await api('POST', '/api/auth/login', { email:S.admin.otpEmail, password:S.admin._pw });
  if (res.requiresOTP){ S.admin.otpDemo=res.demoOTP||null; showLoginStep('otp'); toast('New code sent!'); }
  else { toast('Could not resend','err'); showLoginStep('credentials'); }
}

function setAdminSession(r){ S.admin.token=r.token; S.admin.role=r.role; S.admin.name=r.name; lsSet('adminToken',r.token); lsSet('adminRole',r.role); lsSet('adminName',r.name); }

async function adminLogout(){
  await api('POST','/api/auth/logout');
  S.admin.token=S.admin.role=S.admin.name=null;
  ['adminToken','adminRole','adminName'].forEach(lsDel);
  toast('Logged out');
  nav('home');
}

/* ═══════════════════════════════════════════════════════════════
   ADMIN DASHBOARD
═══════════════════════════════════════════════════════════════ */
const SECTIONS = [
  {k:'dashboard', lbl:'Dashboard',  icon:'🏠'},
  {k:'listings',  lbl:'Listings',   icon:'📦'},
  {k:'lookbook',  lbl:'Lookbook',   icon:'📷'},
  {k:'analytics', lbl:'Analytics',  icon:'📊'},
  {k:'subadmins', lbl:'Sub-Admins', icon:'👥'},
  {k:'activity',  lbl:'Activity',   icon:'🕐'},
  {k:'settings',  lbl:'Settings',   icon:'⚙️'},
];

async function renderAdmin(){
  const app = document.getElementById('app');
  document.getElementById('navbar').style.display = 'none';

  // If no token in state, show login — never make an API call
  if (!S.admin.token) {
    app.innerHTML = loginHTML('credentials');
    return;
  }

  const me = await api('GET','/api/admin/me');
  if (me.error){
    // Token expired or invalid — clear silently, show login (no "Logged out" toast)
    S.admin.token = S.admin.role = S.admin.name = null;
    ['adminToken','adminRole','adminName'].forEach(lsDel);
    app.innerHTML = loginHTML('credentials');
    return;
  }
  S.admin.role = me.role; S.admin.name = me.name;

  const visible = SECTIONS.filter(s => s.k !== 'subadmins' || S.admin.role === 'supreme')
                           .filter(s => s.k !== 'settings'  || S.admin.role === 'supreme');

  const tabs     = visible.map(s => `<button class="admin-tab ${S.admin.section===s.k?'active':''}" onclick="switchSection('${s.k}')"><span class="admin-tab-icon">${s.icon}</span><span class="admin-tab-lbl">${s.lbl}</span></button>`).join('');
  const sidebtns = visible.map(s => `<button class="admin-sidebar-btn ${S.admin.section===s.k?'active':''}" onclick="switchSection('${s.k}')">${s.icon} ${s.lbl}</button>`).join('');

  let main = '';
  switch(S.admin.section){
    case 'dashboard': main = await aDashboard();  break;
    case 'listings':  main = await aListings();   break;
    case 'lookbook':  main = await aLookbook();   break;
    case 'analytics': main = await aAnalytics();  break;
    case 'subadmins': main = await aSubAdmins();  break;
    case 'activity':  main = await aActivity();   break;
    case 'settings':  main = await aSettings();   break;
    default:          main = await aDashboard();
  }

  app.innerHTML = `
  <div class="admin-wrap">
    <div class="admin-sidebar">
      <div class="admin-sidebar-brand">
        <svg width="36" height="40" viewBox="0 0 100 110" fill="none"><circle cx="50" cy="48" r="46" stroke="#F2C4C4" stroke-width="3.5" fill="none" stroke-dasharray="260 25" stroke-linecap="round"/><circle cx="50" cy="48" r="35" fill="#4A0E2B"/><text x="50" y="62" text-anchor="middle" fill="white" font-size="36" font-family="Georgia,serif" font-weight="bold">fl</text><circle cx="83" cy="82" r="5.5" fill="#4A0E2B"/></svg>
        <div class="admin-sidebar-name">FALA ADMIN</div>
        <div class="admin-sidebar-role">${S.admin.role==='supreme' ? '👑 Supreme' : 'Sub-Admin'}</div>
      </div>
      <div class="admin-sidebar-nav">${sidebtns}</div>
      <button class="admin-sidebar-logout" onclick="adminLogout()">🚪 Logout</button>
    </div>
    <div class="admin-main">
      <div class="admin-topbar">
        <div>
          <div class="admin-topbar-title">${visible.find(s=>s.k===S.admin.section)?.lbl||'Admin'}</div>
          <div class="admin-topbar-role">${S.admin.role==='supreme'?'👑 Supreme Admin':'Sub-Admin'} · ${S.admin.name}</div>
        </div>
        <button class="btn btn-outline btn-sm" onclick="adminLogout()">Logout</button>
      </div>
      <div class="admin-content">${main}</div>
    </div>
  </div>
  <div class="admin-tabs">${tabs}</div>
  <div id="sheetOv" class="admin-modal-ov hidden" onclick="closeSheet()">
    <div class="admin-sheet" onclick="event.stopPropagation()">
      <div class="admin-sheet-drag"></div>
      <div class="admin-sheet-hd">
        <span class="admin-sheet-title" id="sheetTitle"></span>
        <button class="admin-sheet-close" onclick="closeSheet()">✕</button>
      </div>
      <div class="admin-sheet-body" id="sheetBody"></div>
    </div>
  </div>`;
}

async function switchSection(s){ S.admin.section=s; await renderAdmin(); }
function openSheet(title,html){ document.getElementById('sheetTitle').textContent=title; document.getElementById('sheetBody').innerHTML=html; document.getElementById('sheetOv').classList.remove('hidden'); }
function closeSheet(){ document.getElementById('sheetOv')?.classList.add('hidden'); }

/* ── DASHBOARD ──────────────────────────────────────────────── */
async function aDashboard(){
  const [prods, analytics] = await Promise.all([
    api('GET','/api/products').then(r=>Array.isArray(r)?r:[]),
    api('GET','/api/admin/analytics?days=7').then(r=>Array.isArray(r)?r:[]),
  ]);
  const tv=analytics.reduce((a,b)=>a+b.visits,0), tw=analytics.reduce((a,b)=>a+b.whatsappClicks,0), tp=analytics.reduce((a,b)=>a+b.productViews,0);
  const mx=Math.max(...analytics.map(d=>d.visits),1);
  const bars=analytics.map(d=>`<div class="bar-col"><div class="bar-val">${d.visits}</div><div class="bar-fill" style="height:${Math.round(d.visits/mx*90)}px"></div><div class="bar-lbl">${d.date.slice(5)}</div></div>`).join('');
  return `<div class="stat-grid">
    <div class="stat-card"><div class="stat-icon">📦</div><div class="stat-num" style="color:#4A0E2B">${prods.length}</div><div class="stat-lbl">Products</div></div>
    <div class="stat-card"><div class="stat-icon">👁</div><div class="stat-num" style="color:#2D7D6F">${tv}</div><div class="stat-lbl">Visits (7d)</div></div>
    <div class="stat-card"><div class="stat-icon">📲</div><div class="stat-num" style="color:#25D366">${tw}</div><div class="stat-lbl">WA Orders</div></div>
    <div class="stat-card"><div class="stat-icon">🔍</div><div class="stat-num" style="color:#C9A84C">${tp}</div><div class="stat-lbl">Views</div></div>
  </div>
  <div class="a-card"><div class="a-card-hd"><span class="a-card-title">Weekly Visits</span></div>
    <div style="padding:12px 8px 4px"><div class="bar-chart">${bars}</div></div>
    <div style="height:16px"></div>
  </div>`;
}

/* ── LISTINGS ───────────────────────────────────────────────── */
async function aListings(){
  const [prods, st] = await Promise.all([
    api('GET','/api/products').then(r=>Array.isArray(r)?r:[]),
    api('GET','/api/settings').then(r=>r.error?{}:r),
  ]);
  const bsId = st.bestsellerProductId;
  const rows = prods.map(p => `
  <div class="prod-row">
    ${p.cover
      ? `<img class="prod-thumb" src="/uploads/products/${esc(p.cover)}" alt="" onerror="this.style.display='none'">`
      : `<div class="prod-thumb-svg">${hairSVG(p.id,44)}</div>`}
    <div class="prod-row-info">
      <div class="prod-row-name">${esc(p.name)}</div>
      <div class="prod-row-meta">${esc(p.category)} · ${(p.images||[]).length}img · ${(p.videos||[]).length}vid${bsId===p.id?' ⭐':''}</div>
    </div>
    <div style="text-align:right;flex-shrink:0">
      <div class="prod-row-price">${fmt(p.price)}</div>
      <span class="${p.availability==='available'?'badge-avail':p.availability==='limited'?'badge-lim':'badge-out'}">${p.availability==='available'?'In Stock':p.availability==='limited'?'Limited':'Out'}</span>
      <div class="prod-row-actions" style="margin-top:6px">
        <button class="btn btn-gold btn-sm" onclick="openEditProduct('${esc(p.id)}')">Edit</button>
        ${S.admin.role==='supreme' ? `
          <button class="btn btn-sm" style="background:#fff;border:1.5px solid ${bsId===p.id?'#b71c1c':'#C9A84C'};color:${bsId===p.id?'#b71c1c':'#C9A84C'};cursor:pointer;padding:6px 10px;font-size:9px;font-family:'Playfair Display',serif;font-weight:700;border-radius:2px;white-space:nowrap" onclick="${bsId===p.id?`unsetBS('${esc(p.id)}')`:`setBS('${esc(p.id)}')`}">${bsId===p.id?'★ Remove':'☆ Bestseller'}</button>
          <button class="btn btn-danger btn-sm" onclick="delProduct('${esc(p.id)}')">Del</button>` : ''}
      </div>
    </div>
  </div>`).join('');

  return `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:10px">
    <h2 style="font-family:'Playfair Display',serif;font-size:20px;font-weight:900;color:#4A0E2B">Product Listings</h2>
    <button class="btn btn-gold btn-md" onclick="openAddProduct()">+ Add Product</button>
  </div>
  ${bsId ? `<div style="background:rgba(201,168,76,.12);border:1px solid rgba(201,168,76,.3);padding:10px 14px;border-radius:4px;margin-bottom:12px;font-size:12px;color:#4A0E2B">⭐ Bestseller: <strong>${esc(prods.find(p=>p.id===bsId)?.name||bsId)}</strong> — shown on homepage hero</div>`
         : `<div style="background:#fff3e0;border:1px solid #ffb74d;padding:10px 14px;border-radius:4px;margin-bottom:12px;font-size:12px;color:#e65100">No bestseller set. Tap ☆ Bestseller on any product to appoint it.</div>`}
  <div class="a-card">${rows||'<div style="padding:32px;text-align:center;color:#999">No products yet — add your first listing</div>'}</div>`;
}

async function setBS(id)  { const r=await api('POST',`/api/products/${id}/bestseller`); r.error?toast(r.error,'err'):(toast('⭐ Bestseller set!'),renderAdmin()); }
async function unsetBS(id){ const r=await api('DELETE',`/api/products/${id}/bestseller`); r.error?toast(r.error,'err'):(toast('Bestseller removed'),renderAdmin()); }
async function delProduct(id){ if(!confirm('Delete this product?')) return; const r=await api('DELETE',`/api/products/${id}`); r.error?toast(r.error,'err'):(toast('Deleted'),renderAdmin()); }

/* ── ADD PRODUCT SHEET ──────────────────────────────────────── */
function colorChecksHTML(checked, namePrefix){
  return ALL_COLORS.map(([v,n]) => `
  <label class="color-check">
    <input type="checkbox" name="${namePrefix}" value="${v}" ${(checked||[]).includes(v)?'checked':''}/>
    <div class="color-check-dot" style="background:${COLOR_HEX[v]||'#333'}"></div>
    <div class="color-check-name">${n}</div>
  </label>`).join('');
}

function openAddProduct(){
  openSheet('Add New Product', `
  <div class="af-2col">
    <div class="af-group" style="grid-column:1/-1"><label class="af-label">Product Name *</label><input id="ap_name" class="af-input" placeholder="e.g. Deep Wave Bundle"/></div>
    <div class="af-group"><label class="af-label">Category</label><select id="ap_cat" class="af-select"><option>Bundles</option><option>Closures</option><option>Frontals</option><option>Wigs</option></select></div>
    <div class="af-group"><label class="af-label">Texture</label><input id="ap_tex" class="af-input" placeholder="e.g. Body Wave"/></div>
    <div class="af-group"><label class="af-label">Price (₦) *</label><input id="ap_price" class="af-input" type="number" placeholder="85000"/></div>
    <div class="af-group"><label class="af-label">Availability</label><select id="ap_avail" class="af-select"><option value="available">In Stock</option><option value="limited">Limited</option><option value="out">Out of Stock</option></select></div>
    <div class="af-group" style="grid-column:1/-1"><label class="af-label">Lengths (comma-separated)</label><input id="ap_lengths" class="af-input" placeholder="18,20,22,24"/></div>
    <div class="af-group" style="grid-column:1/-1"><label class="af-label">Description</label><input id="ap_desc" class="af-input" placeholder="Brief product description"/></div>
    <div class="af-group"><label class="af-label">Tag</label><input id="ap_tag" class="af-input" placeholder="New, Luxe…"/></div>
    <div class="af-group"><label class="af-label">WhatsApp Override</label><input id="ap_wa" class="af-input" placeholder="+234…"/></div>
  </div>
  <div class="af-group"><label class="af-label">Colours Available</label><div class="color-checks">${colorChecksHTML([],'apC')}</div></div>
  <div class="af-group">
    <label class="af-label">Cover Image <span class="cover-required">★ Required</span></label>
    <div class="upload-zone" id="apCZ" onclick="document.getElementById('ap_cover').click()">
      <div class="uz-icon">📷</div><div class="uz-title">Tap to select cover</div><div class="uz-sub">JPG · PNG · WEBP</div>
    </div>
    <input id="ap_cover" type="file" accept="image/*" style="display:none" onchange="prevCover(this,'apCZ','apCP')"/>
    <div id="apCP" class="media-row"></div>
  </div>
  <div class="af-group">
    <label class="af-label">Additional Photos <span style="color:#aaa;font-size:9px">optional · up to 10 · detail page only</span></label>
    <div class="upload-zone" onclick="document.getElementById('ap_imgs').click()">
      <div class="uz-icon">🖼️</div><div class="uz-title">Tap to add photos</div><div class="uz-sub">Multiple allowed</div>
    </div>
    <input id="ap_imgs" type="file" accept="image/*" multiple style="display:none" onchange="prevFiles(this,'apIP','image')"/>
    <div id="apIP" class="media-row"></div>
  </div>
  <div class="af-group">
    <label class="af-label">Videos <span style="color:#aaa;font-size:9px">optional · up to 5 · 150 MB each · detail page only</span></label>
    <div class="upload-zone" onclick="document.getElementById('ap_vids').click()">
      <div class="uz-icon">🎬</div><div class="uz-title">Tap to add videos</div><div class="uz-sub">MP4 · MOV · WEBM</div>
    </div>
    <input id="ap_vids" type="file" accept="video/*" multiple style="display:none" onchange="prevFiles(this,'apVP','video')"/>
    <div id="apVP" class="media-row"></div>
  </div>
  <div class="progress-wrap" id="apProg"><div class="progress-bar"><div class="progress-fill" id="apBar"></div></div><div class="progress-txt" id="apTxt"></div></div>
  <div style="display:flex;gap:10px;margin-top:8px">
    <button class="btn btn-gold btn-full btn-lg" id="apBtn" onclick="submitAddProduct()">Add Product</button>
    <button class="btn btn-outline btn-lg" onclick="closeSheet()">Cancel</button>
  </div>`);
}

function prevCover(input, zoneId, prevId){
  if (!input.files[0]) return;
  if (zoneId) document.getElementById(zoneId)?.classList.add('has-file');
  const prev = document.getElementById(prevId); if (!prev) return;
  const url = URL.createObjectURL(input.files[0]);
  prev.innerHTML = `<div class="media-thumb"><img src="${url}" style="width:80px;height:80px;object-fit:cover;border-radius:4px;border:2px solid var(--gold)"/><div class="media-thumb-name">${input.files[0].name}</div></div>`;
}
function prevFiles(input, prevId, type){
  const prev = document.getElementById(prevId); if (!prev) return;
  const newHTML = Array.from(input.files).map(f => {
    const url = URL.createObjectURL(f);
    const el  = type==='video'
      ? `<div class="media-thumb-vid">▶</div>`
      : `<img src="${url}" style="width:64px;height:64px;object-fit:cover;border-radius:3px;border:1.5px solid var(--champ)"/>`;
    return `<div class="media-thumb">${el}<div class="media-thumb-name">${f.name.slice(0,12)}</div></div>`;
  }).join('');
  prev.innerHTML += newHTML;
}

async function submitAddProduct(){
  const name  = document.getElementById('ap_name')?.value?.trim();
  const price = document.getElementById('ap_price')?.value;
  const cover = document.getElementById('ap_cover')?.files[0];
  if (!name || !price){ toast('Name and price required','err'); return; }
  if (!cover){ toast('Cover image is required ★','err'); return; }

  const cols = Array.from(document.querySelectorAll('[name="apC"]:checked')).map(i=>i.value);
  const lens = (document.getElementById('ap_lengths')?.value||'18,20,22').split(',').map(x=>parseInt(x.trim())).filter(n=>!isNaN(n));

  const fd = new FormData();
  fd.append('name', name); fd.append('price', price);
  fd.append('category',     document.getElementById('ap_cat').value);
  fd.append('texture',      document.getElementById('ap_tex').value.trim());
  fd.append('description',  document.getElementById('ap_desc').value.trim());
  fd.append('availability', document.getElementById('ap_avail').value);
  fd.append('tag',          document.getElementById('ap_tag').value.trim());
  fd.append('whatsapp',     document.getElementById('ap_wa').value.trim());
  fd.append('lengths',      JSON.stringify(lens));
  fd.append('colors',       JSON.stringify(cols.length ? cols : ['1B','2']));
  fd.append('cover', cover);
  for (const f of (document.getElementById('ap_imgs')?.files||[])) fd.append('images', f);
  for (const f of (document.getElementById('ap_vids')?.files||[])) fd.append('videos', f);

  const btn = document.getElementById('apBtn');
  if (btn){ btn.disabled=true; btn.textContent='Uploading…'; }
  document.getElementById('apProg').style.display = 'block';

  const res = await xhrUp('POST', '/api/products', fd, 'apBar', 'apTxt');
  if (btn){ btn.disabled=false; btn.textContent='Add Product'; }
  document.getElementById('apProg').style.display = 'none';

  if (res.error){ toast(res.error,'err'); return; }
  toast('Product added! 🎉'); closeSheet(); await renderAdmin();
}

/* ── EDIT PRODUCT SHEET ──────────────────────────────────────── */
async function openEditProduct(id){
  const p = await api('GET', `/api/products/${id}`);
  if (p.error){ toast('Not found','err'); return; }

  const existImgs = (p.images||[]).map(f => `
  <div class="media-thumb" id="eImg_${f}">
    <img src="/uploads/products/${esc(f)}" style="width:64px;height:64px;object-fit:cover;border-radius:3px;border:1.5px solid var(--champ)" onerror="this.style.display='none'"/>
    <button class="media-thumb-rm" onclick="rmMedia('${esc(id)}','${esc(f)}','image','eImg_${esc(f)}')">✕</button>
    <div class="media-thumb-name">${f.slice(0,12)}</div>
  </div>`).join('') || '<div style="font-size:12px;color:#aaa;padding:4px">None</div>';

  const existVids = (p.videos||[]).map(f => `
  <div class="media-thumb" id="eVid_${f}">
    <div class="media-thumb-vid">▶</div>
    <button class="media-thumb-rm" onclick="rmMedia('${esc(id)}','${esc(f)}','video','eVid_${esc(f)}')">✕</button>
    <div class="media-thumb-name">${f.slice(0,12)}</div>
  </div>`).join('') || '<div style="font-size:12px;color:#aaa;padding:4px">None</div>';

  openSheet(`Edit: ${p.name}`, `
  <div class="af-2col">
    <div class="af-group" style="grid-column:1/-1"><label class="af-label">Name</label><input id="ep_name" class="af-input" value="${esc(p.name)}"/></div>
    <div class="af-group"><label class="af-label">Price (₦)</label><input id="ep_price" class="af-input" type="number" value="${p.price}"/></div>
    <div class="af-group"><label class="af-label">Availability</label>
      <select id="ep_avail" class="af-select">
        <option value="available" ${p.availability==='available'?'selected':''}>In Stock</option>
        <option value="limited"   ${p.availability==='limited'  ?'selected':''}>Limited</option>
        <option value="out"       ${p.availability==='out'      ?'selected':''}>Out of Stock</option>
      </select>
    </div>
    <div class="af-group"><label class="af-label">Tag</label><input id="ep_tag" class="af-input" value="${esc(p.tag||'')}"/></div>
    <div class="af-group" style="grid-column:1/-1"><label class="af-label">Description</label><input id="ep_desc" class="af-input" value="${esc(p.description||'')}"/></div>
    <div class="af-group" style="grid-column:1/-1"><label class="af-label">Lengths</label><input id="ep_lengths" class="af-input" value="${(p.lengths||[]).join(',')}"/></div>
  </div>
  <div class="af-group"><label class="af-label">Colours</label><div class="color-checks">${colorChecksHTML(p.colors,'epC')}</div></div>

  <div class="af-group">
    <label class="af-label">Cover <span class="cover-required">${p.cover?'✅':'★ Missing'}</span></label>
    ${p.cover ? `<div class="media-row" style="margin-bottom:8px">
      <div class="media-thumb" id="eCover">
        <img src="/uploads/products/${esc(p.cover)}" style="width:80px;height:80px;object-fit:cover;border-radius:4px;border:2px solid var(--gold)" onerror="this.style.display='none'"/>
        <button class="media-thumb-rm" onclick="rmMedia('${esc(id)}','${esc(p.cover)}','cover','eCover')">✕</button>
      </div>
    </div>` : ''}
    <div class="upload-zone" onclick="document.getElementById('ep_cover').click()" style="padding:12px"><div class="uz-title" style="font-size:12px">${p.cover?'Replace cover':'Upload cover'}</div></div>
    <input id="ep_cover" type="file" accept="image/*" style="display:none" onchange="prevCover(this,'','eCP')"/>
    <div id="eCP" class="media-row"></div>
  </div>

  <div class="af-group">
    <label class="af-label">Photos <span style="color:#aaa;font-size:9px">✕ to remove</span></label>
    <div class="media-row" id="eImgsRow">${existImgs}</div>
    <div class="upload-zone" onclick="document.getElementById('ep_imgs').click()" style="padding:12px;margin-top:8px"><div class="uz-title" style="font-size:12px">Add more photos</div></div>
    <input id="ep_imgs" type="file" accept="image/*" multiple style="display:none" onchange="prevFiles(this,'eIP','image')"/>
    <div id="eIP" class="media-row"></div>
  </div>

  <div class="af-group">
    <label class="af-label">Videos <span style="color:#aaa;font-size:9px">✕ to remove</span></label>
    <div class="media-row" id="eVidsRow">${existVids}</div>
    <div class="upload-zone" onclick="document.getElementById('ep_vids').click()" style="padding:12px;margin-top:8px"><div class="uz-title" style="font-size:12px">Add more videos</div></div>
    <input id="ep_vids" type="file" accept="video/*" multiple style="display:none" onchange="prevFiles(this,'eVP','video')"/>
    <div id="eVP" class="media-row"></div>
  </div>

  <div class="progress-wrap" id="eProg"><div class="progress-bar"><div class="progress-fill" id="eBar"></div></div><div class="progress-txt" id="eTxt"></div></div>
  <div style="display:flex;gap:10px;margin-top:8px">
    <button class="btn btn-gold btn-full btn-lg" id="eBtn" onclick="submitEdit('${esc(id)}')">Save Changes</button>
    <button class="btn btn-outline btn-lg" onclick="closeSheet()">Cancel</button>
  </div>`);
}

async function rmMedia(pid, filename, type, elId){
  if (!confirm(`Remove this ${type}?`)) return;
  const r = await api('DELETE', `/api/products/${pid}/media`, { filename, type });
  if (r.error){ toast(r.error,'err'); return; }
  if (elId) document.getElementById(elId)?.remove();
  toast(`${type} removed`);
}

async function submitEdit(id){
  const newCover = document.getElementById('ep_cover')?.files[0];
  const newImgs  = document.getElementById('ep_imgs')?.files;
  const newVids  = document.getElementById('ep_vids')?.files;
  const hasFiles = newCover || (newImgs&&newImgs.length) || (newVids&&newVids.length);

  const cols = Array.from(document.querySelectorAll('[name="epC"]:checked')).map(i=>i.value);
  const lens = (document.getElementById('ep_lengths')?.value||'').split(',').map(x=>parseInt(x.trim())).filter(n=>!isNaN(n));

  const body = {
    name:         document.getElementById('ep_name').value.trim(),
    price:        document.getElementById('ep_price').value,
    availability: document.getElementById('ep_avail').value,
    tag:          document.getElementById('ep_tag').value.trim(),
    description:  document.getElementById('ep_desc').value.trim(),
    lengths:      JSON.stringify(lens),
    colors:       JSON.stringify(cols),
  };

  if (!hasFiles){
    const r = await api('PUT', `/api/products/${id}`, body);
    if (r.error){ toast(r.error,'err'); return; }
    toast('Updated ✅'); closeSheet(); await renderAdmin(); return;
  }

  const btn = document.getElementById('eBtn');
  if (btn){ btn.disabled=true; btn.textContent='Uploading…'; }
  document.getElementById('eProg').style.display = 'block';

  const fd = new FormData();
  for (const [k,v] of Object.entries(body)) fd.append(k,v);
  if (newCover) fd.append('cover', newCover);
  for (const f of (newImgs||[])) fd.append('images', f);
  for (const f of (newVids||[])) fd.append('videos', f);

  const r = await xhrUp('PUT', `/api/products/${id}`, fd, 'eBar', 'eTxt');
  if (btn){ btn.disabled=false; btn.textContent='Save Changes'; }
  document.getElementById('eProg').style.display = 'none';

  if (r.error){ toast(r.error,'err'); return; }
  toast('Updated ✅'); closeSheet(); await renderAdmin();
}

/* ── LOOKBOOK ADMIN ─────────────────────────────────────────── */
async function aLookbook(){
  const items = await api('GET','/api/lookbook').then(r=>Array.isArray(r)?r:[]);
  const rows = items.map(l => `
  <div class="lb-admin-row">
    ${l.image ? `<img class="lb-admin-thumb" src="/uploads/lookbook/${esc(l.image)}" alt="" onerror="this.style.display='none'">` : `<div style="width:60px;height:60px;background:var(--champ);border-radius:4px;flex-shrink:0"></div>`}
    <div style="flex:1;min-width:0">
      <div style="font-family:'Playfair Display',serif;font-weight:700;color:#4A0E2B;font-size:14px">${esc(l.title)}</div>
      ${l.description ? `<div style="font-size:12px;color:#aaa;margin-top:2px">${esc(l.description).slice(0,55)}…</div>` : ''}
    </div>
    <button class="btn btn-danger btn-sm" onclick="delLookbook('${esc(l.id)}')">Delete</button>
  </div>`).join('');
  return `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:10px">
    <h2 style="font-family:'Playfair Display',serif;font-size:20px;font-weight:900;color:#4A0E2B">Lookbook</h2>
    <button class="btn btn-gold btn-md" onclick="openAddLookbook()">+ Add Look</button>
  </div>
  <div class="a-card">${rows||'<div style="padding:32px;text-align:center;color:#999;font-style:italic">No lookbook entries yet. Add the first look!</div>'}</div>`;
}

async function delLookbook(id){ if(!confirm('Delete this lookbook entry?')) return; const r=await api('DELETE',`/api/lookbook/${id}`); r.error?toast(r.error,'err'):(toast('Deleted'),renderAdmin()); }

function openAddLookbook(){
  openSheet('Add Lookbook Entry', `
  <div class="af-group"><label class="af-label">Title *</label><input id="lb_title" class="af-input" placeholder="e.g. Silhouette Royale"/></div>
  <div class="af-group"><label class="af-label">Description (optional)</label><input id="lb_desc" class="af-input" placeholder="Brief caption"/></div>
  <div class="af-group">
    <label class="af-label">Image *</label>
    <div class="upload-zone" onclick="document.getElementById('lb_img').click()">
      <div class="uz-icon">📷</div><div class="uz-title">Tap to select image</div><div class="uz-sub">JPG · PNG · WEBP</div>
    </div>
    <input id="lb_img" type="file" accept="image/*" style="display:none" onchange="prevCover(this,'','lbP')"/>
    <div id="lbP" class="media-row"></div>
  </div>
  <div style="display:flex;gap:10px;margin-top:8px">
    <button class="btn btn-gold btn-full btn-lg" id="lbBtn" onclick="submitLookbook()">Add Look</button>
    <button class="btn btn-outline btn-lg" onclick="closeSheet()">Cancel</button>
  </div>`);
}

async function submitLookbook(){
  const title = document.getElementById('lb_title')?.value?.trim();
  const img   = document.getElementById('lb_img')?.files[0];
  if (!title){ toast('Title required','err'); return; }
  if (!img)  { toast('Image required','err'); return; }
  const fd = new FormData();
  fd.append('title', title);
  fd.append('description', document.getElementById('lb_desc').value.trim());
  fd.append('image', img);
  const btn = document.getElementById('lbBtn');
  if (btn){ btn.disabled=true; btn.textContent='Uploading…'; }
  const r = await xhrUp('POST','/api/lookbook',fd,'','');
  if (btn){ btn.disabled=false; btn.textContent='Add Look'; }
  if (r.error){ toast(r.error,'err'); return; }
  toast('Look added! 📷'); closeSheet(); await renderAdmin();
}

/* ── ANALYTICS ──────────────────────────────────────────────── */
async function aAnalytics(){
  const data = await api('GET','/api/admin/analytics?days=7').then(r=>Array.isArray(r)?r:[]);
  const tv=data.reduce((a,b)=>a+b.visits,0), tw=data.reduce((a,b)=>a+b.whatsappClicks,0), tp=data.reduce((a,b)=>a+b.productViews,0);
  const cr = tp>0 ? Math.round(tw/tp*100) : 0;
  const rows = data.map(d => {
    const p = d.productViews>0 ? Math.round(d.whatsappClicks/d.productViews*100) : 0;
    return `<div class="analytics-row">
      <div class="analytics-date">${d.date}</div>
      <div class="analytics-metrics">
        <div class="am-item"><div class="am-val">${d.visits}</div><div class="am-lbl">Visits</div></div>
        <div class="am-item"><div class="am-val">${d.productViews}</div><div class="am-lbl">Views</div></div>
        <div class="am-item"><div class="am-val" style="color:#25D366">${d.whatsappClicks}</div><div class="am-lbl">Orders</div></div>
        <div class="am-item"><div style="font-size:12px;color:var(--gold);font-weight:700">${p}%</div><div class="conv-bar"><div class="conv-fill" style="width:${p}%"></div></div></div>
      </div>
    </div>`;
  }).join('');
  return `<h2 style="font-family:'Playfair Display',serif;font-size:20px;font-weight:900;color:#4A0E2B;margin-bottom:14px">Analytics</h2>
  <div class="stat-grid" style="margin-bottom:16px">
    <div class="stat-card"><div class="stat-icon">📈</div><div class="stat-num" style="color:#4A0E2B">${Math.round(tv/7)}</div><div class="stat-lbl">Avg Visits/Day</div></div>
    <div class="stat-card"><div class="stat-icon">📲</div><div class="stat-num" style="color:#25D366">${Math.round(tw/7)}</div><div class="stat-lbl">Avg Orders/Day</div></div>
    <div class="stat-card"><div class="stat-icon">💹</div><div class="stat-num" style="color:#C9A84C">${cr}%</div><div class="stat-lbl">Conversion</div></div>
    <div class="stat-card"><div class="stat-icon">🔍</div><div class="stat-num" style="color:#2D7D6F">${tp}</div><div class="stat-lbl">Total Views</div></div>
  </div>
  <div class="a-card"><div class="a-card-hd"><span class="a-card-title">7-Day Breakdown</span></div>${rows||'<div style="padding:20px;text-align:center;color:#999">No data yet</div>'}</div>`;
}

/* ── SUB-ADMINS ─────────────────────────────────────────────── */
async function aSubAdmins(){
  const subs = await api('GET','/api/subadmins').then(r=>Array.isArray(r)?r:[]);
  const rows = subs.map(a => `
  <div class="sa-row">
    <div class="sa-avatar">${initials(a.name)}</div>
    <div style="flex:1;min-width:0"><div class="sa-name">${esc(a.name)}</div><div class="sa-email">${esc(a.email)}</div></div>
    <button class="sa-delete" onclick="delSubAdmin('${esc(a.email)}')" title="Remove">🗑</button>
  </div>`).join('');
  return `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:10px">
    <h2 style="font-family:'Playfair Display',serif;font-size:20px;font-weight:900;color:#4A0E2B">Sub-Admins</h2>
    <button class="btn btn-gold btn-md" onclick="openAddSubAdmin()">+ Add Sub-Admin</button>
  </div>
  <div class="a-card">${rows||'<div style="padding:32px;text-align:center;color:#999">No sub-admins yet</div>'}</div>`;
}

async function delSubAdmin(email){ if(!confirm(`Remove ${email}?`)) return; const r=await api('DELETE',`/api/subadmins/${encodeURIComponent(email)}`); r.error?toast(r.error,'err'):(toast('Sub-admin removed'),renderAdmin()); }

function openAddSubAdmin(){
  openSheet('Add Sub-Admin', `
  <div class="af-group"><label class="af-label">Full Name *</label><input id="sa_name" class="af-input" placeholder="Agent Three"/></div>
  <div class="af-group"><label class="af-label">Email *</label><input id="sa_email" class="af-input" type="email" placeholder="agent3@falahairs.com"/></div>
  <div class="af-group"><label class="af-label">Password *</label>
    <div class="pw-wrap"><input id="sa_pw" class="af-input" type="password" placeholder="Secure password"/>
    <button class="pw-toggle" onclick="const i=document.getElementById('sa_pw');i.type=i.type==='password'?'text':'password'">👁</button></div>
  </div>
  <div style="background:#fff3e0;border:1px solid #ffb74d;padding:10px 12px;border-radius:4px;font-size:12px;color:#e65100;margin-bottom:14px">Sub-admins can add &amp; edit products and manage the lookbook. Only Supreme Admin can delete products or sub-admins.</div>
  <div style="display:flex;gap:10px">
    <button class="btn btn-gold btn-full btn-lg" id="saBtn" onclick="submitSubAdmin()">Create</button>
    <button class="btn btn-outline btn-lg" onclick="closeSheet()">Cancel</button>
  </div>`);
}

async function submitSubAdmin(){
  const name=document.getElementById('sa_name')?.value?.trim(), email=document.getElementById('sa_email')?.value?.trim(), pw=document.getElementById('sa_pw')?.value;
  if (!name||!email||!pw){ toast('All fields required','err'); return; }
  const btn=document.getElementById('saBtn'); if(btn){btn.disabled=true;btn.textContent='Creating…';}
  const r=await api('POST','/api/subadmins',{name,email,password:pw});
  if(btn){btn.disabled=false;btn.textContent='Create';}
  if(r.error){toast(r.error,'err');return;}
  toast('Sub-admin created!'); closeSheet(); await renderAdmin();
}

/* ── ACTIVITY ───────────────────────────────────────────────── */
async function aActivity(){
  const logs = await api('GET','/api/admin/activity').then(r=>Array.isArray(r)?r:[]);
  const rows = logs.map(l => `
  <div class="log-item">
    <div>
      <div class="log-action">${esc(l.action)}</div>
      <div class="log-detail"><span class="log-admin">${l.admin==='supreme'?'👑 Supreme Admin':esc(l.admin)}</span> · <em>${esc(l.product)}</em></div>
    </div>
    <div class="log-time">${new Date(l.time).toLocaleString('en-GB',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}</div>
  </div>`).join('');
  return `<h2 style="font-family:'Playfair Display',serif;font-size:20px;font-weight:900;color:#4A0E2B;margin-bottom:14px">Activity Log</h2>
  ${S.admin.role!=='supreme'?`<div style="background:#fff3e0;border:1px solid #ffb74d;padding:10px 14px;border-radius:4px;margin-bottom:12px;font-size:12px;color:#e65100">Showing your actions only.</div>`:''}
  <div class="a-card">${rows||'<div style="padding:32px;text-align:center;color:#999">No activity logged yet</div>'}</div>`;
}

/* ── SETTINGS ───────────────────────────────────────────────── */
async function aSettings(){
  const st = await api('GET','/api/settings').then(r=>r.error?{}:r);
  return `<h2 style="font-family:'Playfair Display',serif;font-size:20px;font-weight:900;color:#4A0E2B;margin-bottom:14px">Site Settings</h2>
  <div class="a-card" style="padding:20px">
    <div style="font-family:'Playfair Display',serif;font-size:11px;font-weight:700;color:#aaa;letter-spacing:2px;text-transform:uppercase;margin-bottom:14px">Contact &amp; Footer</div>
    <div class="af-group"><label class="af-label">Email (shown in footer)</label><input id="st_email" class="af-input" value="${esc(st.email||'')}" placeholder="hello@falahairs.com"/></div>
    <div class="af-group"><label class="af-label">WhatsApp Number (orders link)</label><input id="st_wa" class="af-input" value="${esc(st.whatsapp||'')}" placeholder="+2348000000000"/></div>
    <div class="af-group"><label class="af-label">WhatsApp Button Label</label><input id="st_waLbl" class="af-input" value="${esc(st.whatsappDisplay||'')}" placeholder="Chat with us on WhatsApp"/></div>
    <div class="af-group"><label class="af-label">Brand Tagline (footer)</label><input id="st_tagline" class="af-input" value="${esc(st.brandTagline||'')}" placeholder="Premium luxury hair — delivered worldwide."/></div>
    <button class="btn btn-gold btn-md" id="stBtn" onclick="saveSettings()">Save Settings</button>
    <div id="stSaved" style="display:none;font-size:12px;color:#2D7D6F;margin-top:8px">✅ Settings saved!</div>
  </div>`;
}

async function saveSettings(){
  const btn=document.getElementById('stBtn'); if(btn){btn.disabled=true;btn.textContent='Saving…';}
  const r=await api('PUT','/api/settings',{
    email:           document.getElementById('st_email').value.trim(),
    whatsapp:        document.getElementById('st_wa').value.trim(),
    whatsappDisplay: document.getElementById('st_waLbl').value.trim(),
    brandTagline:    document.getElementById('st_tagline').value.trim(),
  });
  if(btn){btn.disabled=false;btn.textContent='Save Settings';}
  if(r.error){toast(r.error,'err');return;}
  S.settings=r; const saved=document.getElementById('stSaved');
  if(saved){saved.style.display='block';setTimeout(()=>saved.style.display='none',3000);}
  toast('Settings saved ✅');
}

/* ── GLOBAL KEY HANDLER ─────────────────────────────────────── */
window.addEventListener('keydown', e => {
  if (e.key==='Escape'){ closeModal(); closeSheet(); }
});

/* ═══════════════════════════════════════════════════════════════
   BOOT
═══════════════════════════════════════════════════════════════ */
(async function init(){
  const raw   = window.location.pathname.replace(/^\/|\/$/g,'') || 'home';
  const parts = raw.split('/');
  if (parts[0]==='product' && parts[1]){ S.page='product'; S.productId=parts[1]; }
  else {
    const valid = ['home','mart','lookbook','about','admin'];
    S.page = valid.includes(parts[0]) ? parts[0] : 'home';
  }

  // Pre-load settings silently
  api('GET','/api/settings').then(r => { if (!r.error) S.settings=r; });

  syncNav();
  await render();
})();
