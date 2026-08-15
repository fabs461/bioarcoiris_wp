const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  // El token se suele enviar como: "Bearer TOKEN_AQUI"
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado. No se proporcionó un token.' });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next(); // Permite continuar a la siguiente función/ruta
  } catch (error) {
    res.status(403).json({ error: 'Token inválido o expirado.' });
  }
}

module.exports = verifyToken;