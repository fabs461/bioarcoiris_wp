const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const multer = require('multer');
const path = require('path');
const UPLOADS_DIR = path.join(__dirname, 'uploads');
require('dotenv').config();
const upload = require('./src/middleware/uploadMiddleware');
const authRoutes = require('./src/routes/authRoutes');
const productRoutes = require('./src/routes/productRoutes');
const orderRoutes = require('./src/routes/orderRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1);

// Cabeceras de seguridad HTTP (CSP, X-Frame-Options, X-Content-Type-Options, etc.)
app.use(helmet({

  // desactivamos la CSP por defecto para no interferir con las imágenes
  // servidas desde /uploads y Cloudinary.
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false,
}));

// --------------------------------------------------------------
// CORS — configurado para desarrollo LOCAL.
// Se acepta cualquier origen que corra en localhost/127.0.0.1
// (Live Server, http-server, Vite, etc.) sin importar el puerto.
// Cuando el sitio se vuelva a desplegar en un dominio real, cambia
// esto por el/los dominio(s) de producción.
// --------------------------------------------------------------
const LOCAL_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || LOCAL_ORIGIN.test(origin)) return callback(null, true);
    callback(new Error('No permitido por CORS'));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

// Endpoint ligero para confirmar que el servidor local está despierto.
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada.' });
});

// Manejo de errores (incluye los que lanza multer: formato no permitido, archivo muy pesado, etc.)
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'La imagen no puede pesar más de 5MB.' });
    }
    return res.status(400).json({ error: 'Error al subir la imagen: ' + err.message });
  }
  if (err && err.message === 'Formato no permitido') {
    return res.status(400).json({ error: 'Formato de imagen no permitido. Usa JPG, PNG, WEBP, GIF o AVIF.' });
  }
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor.' });
});

// Servidor escuchando (local)
app.listen(PORT, () => {
  console.log(`Servidor de Bio-Arcoiris corriendo en http://localhost:${PORT}`);
});