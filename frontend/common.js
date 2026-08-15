/* =============================================================
   BIO-ARCOIRIS — utilidades compartidas
   ============================================================= */

// Backend local. Levanta el backend con "npm run dev" dentro de /backend
// (por defecto queda escuchando en el puerto 3000).
const API_URL = "http://localhost:3000/api";
const SERVER_ORIGIN = "http://localhost:3000";

const PLACEHOLDER_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 160"><rect width="200" height="160" fill="#161616"/><path d="M70 100l20-24 18 20 14-16 28 32H70z" fill="#3a3a3a"/><circle cx="80" cy="62" r="10" fill="#3a3a3a"/></svg>'
  );

function imageUrl(product) {
  return product && product.image_url ? product.image_url : PLACEHOLDER_IMAGE;
}

const COLOR_SWATCHES = {
  "azul marino": "#1b2a40", "azul": "#33587a", "celeste": "#8fb3cc",
  "negro": "#111214", "blanco": "#f5f5f4", "gris": "#7c8896",
  "gris claro": "#c3cbd3", "beige": "#cdb997", "camel": "#b08b5a",
  "café": "#5a4632", "marrón": "#5a4632", "verde": "#4c6b52",
  "verde oliva": "#5b6b4e", "rojo": "#8c3b3b", "vino": "#6b2f3a",
  "burdeos": "#6b2f3a", "rosa": "#c98fa0", "amarillo": "#c9a63f",
  "mostaza": "#af8a2e",
};
const DEFAULT_SWATCH = "#8a8a8a";

// Catálogos ("estanterías") de la tienda. Única fuente: se usa
// para armar los 6 accesos de inicio, los enlaces del menú y el selector
// de catálogo en el formulario de administración.
const CATEGORIES = [
  {
    slug: "ofertas-del-mes",
    label: "Ofertas del mes",
    icon: '<svg viewBox="0 0 24 24" fill="none"><path d="M4 13.2 13.2 4H19a1 1 0 0 1 1 1v5.8L10.8 20 4 13.2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><circle cx="15.5" cy="8.5" r="1.4" fill="currentColor"/></svg>',
  },
  {
    slug: "accesorios",
    label: "Accesorios",
    icon: '<svg viewBox="0 0 24 24" fill="none"><path d="M7 8V6.5a5 5 0 0 1 10 0V8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><rect x="4" y="8" width="16" height="12" rx="2" stroke="currentColor" stroke-width="1.5"/></svg>',
  },
  {
    slug: "marca1",
    label: "Marca 1",
    icon: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>',
  },
  {
    slug: "marca2",
    label: "Marca 2",
    icon: '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.5"/></svg>',
  },
  {
    slug: "marca3",
    label: "Marca 3",
    icon: '<svg viewBox="0 0 24 24" fill="none"><rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M4 15l4.5-5 4 4L18 9l2 2" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/></svg>',
  },
  {
    slug: "marca4",
    label: "Marca 4",
    icon: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 3.5 20.5 9 12 14.5 3.5 9 12 3.5Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M3.5 15 12 20.5 20.5 15" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>',
  },
];

function categoryLabel(slug) {
  const cat = CATEGORIES.find((c) => c.slug === slug);
  return cat ? cat.label : "Catálogo";
}

function escapeHtml(str) {
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function normalize(str) {
  return String(str).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function swatchFor(color) {
  return COLOR_SWATCHES[normalize(color)] || DEFAULT_SWATCH;
}

// Acepta tanto coma como punto como separador decimal (ej. "150,50" o "150.50").
function parsePriceInput(rawValue) {
  const cleaned = String(rawValue).trim().replace(",", ".");
  if (cleaned === "") return null;
  const n = Number(cleaned);
  if (!isFinite(n) || n < 0) return null;
  return n;
}

function formatBs(amount) {
  const n = Number(amount) || 0;
  return "Bs " + n.toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/* -----------------------------------------------------------
   Sesión de administrador — validación del token guardado
   ----------------------------------------------------------- */
function decodeJwtPayload(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}

// Verifica que el token guardado tenga forma de JWT y no esté vencido.
// Evita que el botón/menú de administrador (p. ej. "Pedidos") quede
// visible con un token viejo o inválido que el backend ya rechazaría.
function isValidAdminToken(token) {
  if (!token) return false;
  const payload = decodeJwtPayload(token);
  if (!payload || !payload.exp) return false;
  return payload.exp * 1000 > Date.now();
}

/* -----------------------------------------------------------
   Carrito — persistencia local (compartida entre páginas)
   ----------------------------------------------------------- */
function loadCart() {
  try {
    const raw = localStorage.getItem("ba_cart");
    return raw ? JSON.parse(raw) : [];
  } catch (e) { return []; }
}

function saveCart(cart) {
  localStorage.setItem("ba_cart", JSON.stringify(cart));
}

function cartCount(cart) {
  return cart.reduce((sum, c) => sum + c.qty, 0);
}

function addProductToCart(product, qty) {
  qty = qty || 1;
  const cart = loadCart();
  const existing = cart.find((c) => c.id == product.id);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      size: product.size,
      color: product.color,
      price: Number(product.price) || 0,
      image_url: product.image_url || null,
      qty: qty,
    });
  }
  saveCart(cart);
  return cart;
}

/* -----------------------------------------------------------
   Lista de deseos — persistencia local (compartida entre páginas)
   ----------------------------------------------------------- */
function loadWishlist() {
  try {
    const raw = localStorage.getItem("ba_wishlist");
    return raw ? JSON.parse(raw) : [];
  } catch (e) { return []; }
}

function saveWishlist(list) {
  localStorage.setItem("ba_wishlist", JSON.stringify(list));
}

function isInWishlist(productId) {
  return loadWishlist().some((id) => id == productId);
}

function toggleWishlist(productId) {
  let list = loadWishlist();
  if (list.some((id) => id == productId)) {
    list = list.filter((id) => id != productId);
  } else {
    list.push(productId);
  }
  saveWishlist(list);
  return list;
}

/* -----------------------------------------------------------
   Últimos productos visitados (compartido entre páginas)
   ----------------------------------------------------------- */
function loadRecentlyViewed() {
  try {
    const raw = localStorage.getItem("ba_recent");
    return raw ? JSON.parse(raw) : [];
  } catch (e) { return []; }
}

function pushRecentlyViewed(productId) {
  let list = loadRecentlyViewed().filter((id) => id != productId);
  list.unshift(productId);
  list = list.slice(0, 6);
  localStorage.setItem("ba_recent", JSON.stringify(list));
}

/* -----------------------------------------------------------
   Insignias compartidas de carrito / lista de deseos
   Actualiza cualquier elemento con [data-badge="cart"] o
   [data-badge="wishlist"] presente en la página actual.
   ----------------------------------------------------------- */
function refreshSharedBadges() {
  const cartTotal = cartCount(loadCart());
  const wishTotal = loadWishlist().length;
  document.querySelectorAll('[data-badge="cart"]').forEach((el) => {
    if (cartTotal > 0) { el.textContent = String(cartTotal); el.hidden = false; }
    else { el.hidden = true; }
  });
  document.querySelectorAll('[data-badge="wishlist"]').forEach((el) => {
    if (wishTotal > 0) { el.textContent = String(wishTotal); el.hidden = false; }
    else { el.hidden = true; }
  });
}