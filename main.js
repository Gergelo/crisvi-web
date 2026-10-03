// ===== Filtros del catálogo =====
const filtros = document.querySelectorAll('.filtro');
const cards = document.querySelectorAll('.card');
filtros.forEach((btn) => {
  btn.addEventListener('click', () => {
    const f = btn.dataset.filtro;
    filtros.forEach((b) => {
      const on = b === btn;
      b.classList.toggle('activo', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    cards.forEach((c) => { c.hidden = f !== 'todo' && c.dataset.cat !== f; });
  });
});

// ===== Menú desplegable (móvil) =====
const menuBtn = document.querySelector('.menu-btn');
const menu = document.getElementById('menu');
function abrirMenu(abrir) {
  menu.classList.toggle('abierto', abrir);
  menuBtn.setAttribute('aria-expanded', abrir ? 'true' : 'false');
  menuBtn.setAttribute('aria-label', abrir ? 'Cerrar menú' : 'Abrir menú');
}
menuBtn.addEventListener('click', () => abrirMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));
menu.addEventListener('click', (e) => { if (e.target.closest('a')) abrirMenu(false); });
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && menuBtn.getAttribute('aria-expanded') === 'true') { abrirMenu(false); menuBtn.focus(); }
});
document.addEventListener('click', (e) => {
  if (!e.target.closest('.header')) abrirMenu(false);
});

// ===== Enlace activo del menú según la sección que se está viendo =====
if ('IntersectionObserver' in window) {
  const enlaces = new Map([...menu.querySelectorAll('a')].map((a) => [a.getAttribute('href').slice(1), a]));
  const marcar = new IntersectionObserver((entradas) => {
    entradas.forEach((en) => {
      if (!en.isIntersecting) return;
      enlaces.forEach((a, id) => a.classList.toggle('activo', id === en.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  ['inicio', 'productos', 'mayoristas', 'contacto'].forEach((id) => marcar.observe(document.getElementById(id)));
}

// ===== Cabecera que asoma desde arriba al bajar =====
// Mientras se ve la portada va en el flujo; al pasarla se fija y baja con una animación.
const cabecera = document.querySelector('.header');
const pagina = document.querySelector('.page');
// Una vez fija: se encoge, se esconde tras bajar ~140 px seguidos y reaparece al subir un poco.
// Un único listener de scroll (con requestAnimationFrame) reparte el trabajo entre todos los efectos.
const alScroll = [];
let scrollPendiente = false;
window.addEventListener('scroll', () => {
  if (scrollPendiente) return;
  scrollPendiente = true;
  requestAnimationFrame(() => {
    scrollPendiente = false;
    const y = window.scrollY;
    for (const fn of alScroll) fn(y);
  });
}, { passive: true });

let altoCab = cabecera.offsetHeight;
let fijo = false;
let yPrevia = window.scrollY;
let bajado = 0;
function ajustarCabecera(y) {
  const dy = y - yPrevia;
  yPrevia = y;
  if (!fijo && y > altoCab + 10) {
    altoCab = cabecera.offsetHeight;
    pagina.style.setProperty('--hh', altoCab + 'px');
    pagina.classList.add('con-fijo');
    cabecera.classList.add('fijo');
    fijo = true;
    bajado = 0;
  } else if (fijo && y < 4) {
    cabecera.classList.remove('fijo', 'compacta', 'oculta');
    pagina.classList.remove('con-fijo');
    altoCab = cabecera.offsetHeight;
    fijo = false;
  }
  if (!fijo) return;
  cabecera.classList.toggle('compacta', y > altoCab + 120);
  if (dy > 0) {
    bajado += dy;
    if (bajado > 140 && menuBtn.getAttribute('aria-expanded') !== 'true') cabecera.classList.add('oculta');
  } else if (dy < -6) {
    bajado = 0;
    cabecera.classList.remove('oculta');
  }
}
alScroll.push(ajustarCabecera);
window.addEventListener('resize', () => { if (!fijo) altoCab = cabecera.offsetHeight; else pagina.style.setProperty('--hh', altoCab + 'px'); });
ajustarCabecera(window.scrollY);

// ===== Revelado al hacer scroll (cada elemento, una sola vez) =====
// Solo si hay IntersectionObserver y no se pidió reducir movimiento (lo decide el script de <head> con la clase "rev").
if (document.documentElement.classList.contains('rev')) {
  const revelar = new IntersectionObserver((entradas) => {
    let i = 0;
    entradas.forEach((en) => {
      if (!en.isIntersecting) return;
      const el = en.target;
      el.style.transitionDelay = Math.min(i * 70, 350) + 'ms';
      i++;
      el.classList.add('visto');
      revelar.unobserve(el);
      // Al terminar se limpia todo para no interferir con los efectos de hover.
      setTimeout(() => { el.removeAttribute('data-reveal'); el.classList.remove('visto'); el.style.transitionDelay = ''; }, 1200);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });
  document.querySelectorAll('[data-reveal]').forEach((el) => revelar.observe(el));
}

// ===== Decoración flotante con parallax (iconos de la marca a otra velocidad que el contenido) =====
const deco = [...document.querySelectorAll('.deco [data-v]')].map((el) => ({
  el, sec: el.closest('section'), v: parseFloat(el.dataset.v), r: parseFloat(el.dataset.r || 0), g: parseFloat(el.dataset.g || 0)
}));
function moverDeco() {
  const vh = window.innerHeight;
  const rects = new Map();
  for (const d of deco) if (!rects.has(d.sec)) rects.set(d.sec, d.sec.getBoundingClientRect());
  for (const d of deco) {
    const r = rects.get(d.sec);
    if (r.bottom < -150 || r.top > vh + 150) continue;
    const c = (r.top + r.height / 2) - vh / 2;
    d.el.style.transform = `translate3d(0,${(c * d.v).toFixed(1)}px,0) rotate(${(d.r + c * d.g).toFixed(1)}deg)`;
  }
}
// ===== Botón de WhatsApp (se oculta en el pie) y oruga del césped (aparece al pasar la portada) =====
if ('IntersectionObserver' in window) {
  const visibles = new Set();
  const io = new IntersectionObserver((entradas) => {
    entradas.forEach((en) => (en.isIntersecting ? visibles.add(en.target) : visibles.delete(en.target)));
    document.getElementById('oruga-cesped').classList.toggle('visible', !visibles.has(document.getElementById('inicio')));
    document.getElementById('wa-izq').classList.toggle('oculto', visibles.has(document.getElementById('contacto')));
  }, { rootMargin: '0px 0px -120px 0px' });
  io.observe(document.getElementById('inicio'));
  io.observe(document.getElementById('contacto'));
}

// ===== Lápices 3D que giran con el scroll =====
// Solo desde 1024 px: en móvil y tableta taparían texto y costarían rendimiento en gama baja.
const LAPICES = [
  { top: 380, lado: 'left', color: '#FFC21A', rot: -68, vel: -0.22, giro: 0.2 },
  { top: 980, lado: 'right', color: '#2450C8', rot: 62, vel: 0.16, giro: -0.18 },
  { top: 1600, lado: 'left', color: '#2BA84A', rot: -112, vel: 0.2, giro: 0.25 },
  { top: 2200, lado: 'right', color: '#FF7A1A', rot: 74, vel: -0.18, giro: -0.22 },
  { top: 2800, lado: 'left', color: '#7B3FC4', rot: -58, vel: 0.14, giro: 0.18 },
  { top: 3300, lado: 'right', color: '#F0549A', rot: 108, vel: -0.15, giro: -0.25 }
];
const R = 12.12;        // apotema del hexágono (cara de 14px)
const PHI = 16.9;       // inclinación de las caras de la punta
const MADERA = '#F2C38F';
const LUZ = 40;         // ángulo de la luz

const capa = document.getElementById('lapices');
const sombra = (o) => `linear-gradient(rgba(0,0,0,${o.toFixed(3)}), rgba(0,0,0,${o.toFixed(3)}))`;

let lapices = null;
const construir = () => LAPICES.map((l) => {
  const el = document.createElement('div');
  el.className = 'lapiz';
  el.style.top = l.top + 'px';
  el.style[l.lado] = '-50px';
  const stage = document.createElement('div');
  stage.className = 'lapiz__stage';
  const caras = [];
  const puntas = [];
  for (let k = 0; k < 6; k++) {
    const th = 30 + 60 * k;
    const cara = document.createElement('div');
    cara.className = 'lapiz__cara';
    cara.style.transform = `rotateX(${th}deg) translateZ(${R}px)`;
    if (k === 1) cara.textContent = 'CRISVI';
    const punta = document.createElement('div');
    punta.className = 'lapiz__punta';
    punta.style.transform = `rotateX(${th}deg) translateZ(${R}px) rotateY(${PHI}deg)`;
    stage.append(cara, punta);
    caras.push({ el: cara, th });
    puntas.push({ el: punta, th });
  }
  const tapa = document.createElement('div');
  tapa.className = 'lapiz__tapa';
  tapa.style.background = `radial-gradient(circle, ${l.color} 0 20%, #E3AE74 21% 62%, rgba(0,0,0,0) 63%), ${sombra(0.3)}, ${l.color}`;
  stage.append(tapa);
  el.append(stage);
  capa.append(el);
  return { ...l, stage, caras, puntas };
});

function pintar(s) {
  if (!lapices) return;
  const vh = window.innerHeight;
  for (const l of lapices) {
    const y = l.top + s * l.vel;
    if (y < s - 400 || y > s + vh + 400) continue; // fuera de pantalla: no repintar
    const volteo = s * l.giro;
    const rueda = s * l.giro * 1.6;
    l.stage.style.transform = `translateY(${(s * l.vel).toFixed(1)}px) rotate(${l.rot}deg) rotateY(${volteo.toFixed(2)}deg) rotateX(${rueda.toFixed(2)}deg)`;
    for (let k = 0; k < 6; k++) {
      const th = l.caras[k].th;
      const d = Math.max(0, Math.cos((th + rueda - LUZ) * Math.PI / 180));
      const o = 0.06 + 0.5 * (1 - d);
      l.caras[k].el.style.background = `linear-gradient(to right, rgba(255,255,255,${(0.18 * d).toFixed(3)}), rgba(255,255,255,0)), ${sombra(o)}, ${l.color}`;
      l.puntas[k].el.style.background = `${sombra(o)}, linear-gradient(to right, ${MADERA} 0%, ${MADERA} 62%, ${l.color} 62%, ${l.color} 100%)`;
    }
  }
}

const reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const ancha = window.matchMedia('(min-width: 1024px)');
function activar() {
  if (ancha.matches && !lapices) lapices = construir();
  pintar(window.scrollY);
}
activar();
ancha.addEventListener('change', activar);
if (!reducir) {
  alScroll.push((y) => { if (ancha.matches) pintar(y); });
  if (deco.length) { alScroll.push(moverDeco); moverDeco(); }
}

