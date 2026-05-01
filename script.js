/* ========================================
   TECHSTACK — script.js
   Módulos: API, Renderizado, Chat, UI
======================================== */

// ── CONFIG ──────────────────────────────
const API = '/api';

// Respuestas del bot de chat
const BOT_RESPUESTAS = {
  envio: ['📦 Envíos nacionales en 2-4 días hábiles. Internacional: 7-14 días. Tracking incluido en todos los pedidos.'],
  garantia: ['🛡️ Todos los productos tienen garantía mínima de 1 año. Laptops y monitores: 2 años oficiales del fabricante.'],
  devolucion: ['↩️ Tienes 30 días para devoluciones sin preguntas. Reembolso en 5 días hábiles.'],
  pago: ['💳 Hasta 12 cuotas sin interés con Visa/Mastercard. También aceptamos BTC, ETH y USDT.'],
  laptop: ['💻 Tenemos 5 laptops premium: MacBook Pro M3, ThinkPad X1, Framework 16, ROG Zephyrus y Dell XPS 15. ¿Alguna en especial?'],
  oferta: ['🔥 Las mejores ofertas están en la sección Ofertas. Flash Sale activo en Laptops con hasta 20% de descuento.'],
  precio: ['💰 Nuestros precios incluyen IVA. Aceptamos múltiples métodos de pago y tenemos financiamiento disponible.'],
  contacto: ['📍 Showroom en Quito: Ed. Centrum, Av. Naciones Unidas. L-V 9:00-18:00, Sáb 10:00-14:00. También por email: hola@techstack.dev'],
  default: [
    '¿Puedo ayudarte con algo más? 😊 Prueba preguntarme sobre envíos, garantías o productos específicos.',
    'Estoy aquí para ayudarte. Puedes preguntar por categorías, precios o cualquier duda.',
    'No estoy seguro de entender. ¿Podrías reformular? O elige una opción rápida abajo 👇'
  ]
};

// ── UTILIDADES ───────────────────────────
function stars(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  return '★'.repeat(full) + (half ? '½' : '') + ' ' + rating.toFixed(1);
}

function formatNum(n) {
  return n >= 1000 ? (n / 1000).toFixed(1) + 'k' : n;
}

function timeAgo(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - d) / 86400000);
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Ayer';
  return `Hace ${diff} días`;
}

// ── ANIMACIÓN CONTADOR ───────────────────
function animateCounter(el, target, duration = 1800) {
  const start = performance.now();
  const update = (ts) => {
    const p = Math.min((ts - start) / duration, 1);
    const ease = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.floor(ease * target).toLocaleString('es');
    if (p < 1) requestAnimationFrame(update);
    else el.textContent = target.toLocaleString('es');
  };
  requestAnimationFrame(update);
}

function initStats() {
  const els = document.querySelectorAll('.stat-num');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const target = parseInt(e.target.dataset.target);
        animateCounter(e.target, target);
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.5 });
  els.forEach(el => observer.observe(el));
}

// ── COUNTDOWN ───────────────────────────
function initCountdown() {
  // Simular expiración en ~8 horas desde ahora
  const expire = new Date(Date.now() + 8 * 3600 * 1000 + 24 * 60 * 1000);
  const tick = () => {
    const diff = expire - Date.now();
    if (diff <= 0) { clearInterval(cd); return; }
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    document.getElementById('cd-h').textContent = String(h).padStart(2, '0');
    document.getElementById('cd-m').textContent = String(m).padStart(2, '0');
    document.getElementById('cd-s').textContent = String(s).padStart(2, '0');
  };
  tick();
  const cd = setInterval(tick, 1000);
}

// ── RENDERIZADO ─────────────────────────

function renderProductCard(item) {
  const badgeHtml = item.badge
    ? `<span class="card-badge">${item.badge}</span>`
    : '<span></span>';
  const descOldHtml = item.precioAntes
    ? `<span class="card-antes">$${item.precioAntes}</span>`
    : '';
  return `
    <li class="product-card" data-cat="${item.cat}">
      <div class="card-top">
        <span class="card-cat">${item.cat}</span>
        ${badgeHtml}
      </div>
      <div class="card-name">${item.nombre}</div>
      <div class="card-desc">${item.desc || ''}</div>
      <div class="card-footer">
        <div class="card-prices">
          <span class="card-precio">$${item.precio}</span>
          ${descOldHtml}
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:.3rem">
          <span class="card-stars">${stars(item.rating || 4.5)}</span>
          <button class="card-btn" onclick="addToCart('${item.nombre}')">Agregar</button>
        </div>
      </div>
    </li>`;
}

function renderOfertaCard(item) {
  // Muestra el badge "OFERTA" resaltado para productos de oferta
  const descPct = item.precioAntes
    ? Math.round((1 - item.precio / item.precioAntes) * 100)
    : 0;
  return `
    <li class="product-card" data-cat="${item.cat}">
      <div class="card-top">
        <span class="card-cat">${item.cat}</span>
        <span class="card-badge badge-sale">-${descPct}% OFF</span>
      </div>
      <div class="card-name">${item.nombre}</div>
      <div class="card-desc">${item.desc || ''}</div>
      <div class="card-footer">
        <div class="card-prices">
          <span class="card-precio">$${item.precio}</span>
          ${item.precioAntes ? `<span class="card-antes">$${item.precioAntes}</span>` : ''}
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:.3rem">
          <span class="card-stars">${stars(item.rating || 4.5)}</span>
          <button class="card-btn" onclick="addToCart('${item.nombre}')">Agregar</button>
        </div>
      </div>
    </li>`;
}

function renderCatCard(cat) {
  return `
    <li class="cat-card" onclick="filterByCategory('${cat.slug}')">
      <div class="cat-icon">${cat.icono}</div>
      <div class="cat-nombre">${cat.nombre}</div>
      <div class="cat-desc">${cat.desc}</div>
      <span class="cat-count">${cat.count} productos</span>
    </li>`;
}

function renderTestimonio(t) {
  return `
    <div class="testimonio-card">
      <div class="tcard-header">
        <div class="tcard-avatar">${t.avatar}</div>
        <div class="tcard-info">
          <span class="tcard-user">@${t.usuario}</span>
          <span class="tcard-rol">${t.rol}</span>
        </div>
      </div>
      <p class="tcard-msg">"${t.mensaje}"</p>
      <div class="tcard-footer">
        <span class="tcard-likes">❤️ <span>${t.likes}</span> likes</span>
        <span class="tcard-date">${timeAgo(t.fecha)}</span>
      </div>
    </div>`;
}

function renderFaq(faq) {
  return `
    <div class="faq-item">
      <button class="faq-q" onclick="toggleFaq(this)">
        ${faq.pregunta}
        <span class="faq-icon">+</span>
      </button>
      <div class="faq-a">${faq.respuesta}</div>
    </div>`;
}

// ── FETCH HELPERS ────────────────────────
async function fetchJSON(endpoint) {
  const res = await fetch(`${API}/${endpoint}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ── CARGA DE DATOS ───────────────────────
async function cargarProductos() {
  const grid = document.getElementById('productosGrid');
  try {
    const data = await fetchJSON('productos');
    grid.innerHTML = data.map(renderProductCard).join('');
    initFilters();
  } catch (e) {
    grid.innerHTML = `<li class="product-skeleton" style="color:#ff4d6d;padding:1rem">Error API: ${e.message}</li>`;
  }
}

async function cargarOfertas() {
  const grid = document.getElementById('ofertasGrid');
  try {
    const data = await fetchJSON('productos');
    // Mostrar los que tienen precioAntes (los que están en oferta)
    const enOferta = data.filter(p => p.precioAntes).slice(0, 3);
    grid.innerHTML = enOferta.map(renderOfertaCard).join('');
  } catch (e) {
    grid.innerHTML = `<li class="product-skeleton" style="color:#ff4d6d;padding:1rem">Error: ${e.message}</li>`;
  }
}

async function cargarCategorias() {
  const grid = document.getElementById('catGrid');
  try {
    const data = await fetchJSON('categorias');
    grid.innerHTML = data.map(renderCatCard).join('');
  } catch (e) {
    grid.innerHTML = `<li class="cat-skeleton" style="color:#ff4d6d;padding:1rem">Error: ${e.message}</li>`;
  }
}

async function cargarComunidad() {
  const grid = document.getElementById('testimoniosGrid');
  try {
    const data = await fetchJSON('comunidad');
    grid.innerHTML = data.map(renderTestimonio).join('');
  } catch (e) {
    grid.innerHTML = `<div style="color:#ff4d6d">Error: ${e.message}</div>`;
  }
}

async function cargarFaq() {
  const grid = document.getElementById('faqGrid');
  try {
    const data = await fetchJSON('soporte');
    grid.innerHTML = data.map(renderFaq).join('');
  } catch (e) {
    grid.innerHTML = `<div style="color:#ff4d6d">Error: ${e.message}</div>`;
  }
}

// ── FILTROS ──────────────────────────────
function initFilters() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      document.querySelectorAll('#productosGrid .product-card').forEach(card => {
        const show = filter === 'all' || card.dataset.cat === filter;
        card.classList.toggle('hidden', !show);
      });
    });
  });
}

function filterByCategory(slug) {
  document.getElementById('ofertas').scrollIntoView({ behavior: 'smooth' });
  setTimeout(() => {
    document.querySelectorAll('.filter-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.filter === slug);
    });
    document.querySelectorAll('#productosGrid .product-card').forEach(card => {
      card.classList.toggle('hidden', card.dataset.cat !== slug);
    });
  }, 600);
}

// ── FAQ ACCORDION ────────────────────────
function toggleFaq(btn) {
  const item = btn.closest('.faq-item');
  const isOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
  if (!isOpen) item.classList.add('open');
}

// ── CARRITO (mini-feedback) ───────────────
function addToCart(nombre) {
  const btn = event.target;
  const orig = btn.textContent;
  btn.textContent = '✓ Agregado';
  btn.style.background = 'var(--accent)';
  btn.style.color = 'var(--bg)';
  setTimeout(() => {
    btn.textContent = orig;
    btn.style.background = '';
    btn.style.color = '';
  }, 1500);
}

// ── NAV SCROLL ───────────────────────────
function initNav() {
  const navbar = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const navMobile = document.getElementById('navMobile');

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
    // Actualizar link activo
    const sections = ['inicio', 'ofertas', 'categorias', 'comunidad', 'soporte'];
    let current = 'inicio';
    sections.forEach(id => {
      const el = document.getElementById(id);
      if (el && window.scrollY >= el.offsetTop - 120) current = id;
    });
    document.querySelectorAll('.nav-link').forEach(a => {
      a.classList.toggle('active', a.getAttribute('href') === `#${current}`);
    });
  });

  hamburger.addEventListener('click', () => {
    navMobile.classList.toggle('open');
  });

  document.querySelectorAll('.nav-link-m').forEach(a => {
    a.addEventListener('click', () => navMobile.classList.remove('open'));
  });
}

// ── CHAT ────────────────────────────────
let chatOpen = false;

function toggleChat() {
  chatOpen = !chatOpen;
  document.getElementById('chatWidget').classList.toggle('open', chatOpen);
  if (chatOpen) {
    document.getElementById('fabBadge').classList.add('hidden');
    document.getElementById('chatInput').focus();
  }
}

function getBotReply(msg) {
  const m = msg.toLowerCase();
  if (m.includes('envío') || m.includes('envio') || m.includes('entrega')) return pick(BOT_RESPUESTAS.envio);
  if (m.includes('garantía') || m.includes('garantia')) return pick(BOT_RESPUESTAS.garantia);
  if (m.includes('devolu') || m.includes('retorn')) return pick(BOT_RESPUESTAS.devolucion);
  if (m.includes('pago') || m.includes('cuota') || m.includes('precio') || m.includes('costo')) return pick(BOT_RESPUESTAS.pago);
  if (m.includes('laptop') || m.includes('macbook') || m.includes('notebook') || m.includes('portátil')) return pick(BOT_RESPUESTAS.laptop);
  if (m.includes('oferta') || m.includes('descuento') || m.includes('promo')) return pick(BOT_RESPUESTAS.oferta);
  if (m.includes('contacto') || m.includes('dirección') || m.includes('tienda') || m.includes('quito')) return pick(BOT_RESPUESTAS.contacto);
  return pick(BOT_RESPUESTAS.default);
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function appendMsg(text, isBot) {
  const msgs = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.className = `msg ${isBot ? 'msg-bot' : 'msg-user'}`;
  div.innerHTML = isBot
    ? `<div class="msg-avatar">⬡</div><div class="msg-bubble">${text}</div>`
    : `<div class="msg-bubble">${text}</div>`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

function showTyping() {
  const msgs = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.className = 'msg msg-bot';
  div.id = 'typingIndicator';
  div.innerHTML = `<div class="msg-avatar">⬡</div>
    <div class="msg-typing"><span></span><span></span><span></span></div>`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

function hideTyping() {
  const el = document.getElementById('typingIndicator');
  if (el) el.remove();
}

function sendChat() {
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  appendMsg(text, false);
  showTyping();
  setTimeout(() => {
    hideTyping();
    appendMsg(getBotReply(text), true);
  }, 800 + Math.random() * 600);
}

function sendQuick(text) {
  document.getElementById('chatInput').value = text;
  sendChat();
}

// ── INTERSECTION OBSERVER para animaciones ─
function initReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.opacity = '1';
        e.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.s-section').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = 'opacity .6s ease, transform .6s ease';
    observer.observe(el);
  });
}

// ── INIT ────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  initNav();
  initStats();
  initCountdown();
  initReveal();

  // Carga paralela de todos los datos
  await Promise.allSettled([
    cargarOfertas(),
    cargarProductos(),
    cargarCategorias(),
    cargarComunidad(),
    cargarFaq()
  ]);

  console.log('🚀 TechStack v2 cargado correctamente');
});