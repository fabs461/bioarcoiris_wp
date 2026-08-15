const rateLimit = require('express-rate-limit');

// Login de administrador: máximo 8 intentos cada 15 minutos por IP.
// Frena los ataques de fuerza bruta contra la contraseña de admin.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos de inicio de sesión. Intenta de nuevo en unos minutos.' },
});

// Creación de pedidos (endpoint público, sin login): máximo 20 pedidos
// por hora por IP. Evita que alguien inunde la base de datos con
// pedidos falsos, sin bloquear a un cliente real que compra varias veces.
const orderLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Se recibieron demasiados pedidos desde este dispositivo. Intenta de nuevo más tarde.' },
});

module.exports = { loginLimiter, orderLimiter };