const db = require('../config/db');

const VALID_CATEGORIES = ['ofertas-del-mes', 'accesorios', 'marca1', 'marca2', 'marca3', 'marca4'];

exports.getAllProducts = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM products ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ error: 'Error al obtener inventario.' });
  }
};

exports.getProductById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM products WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado.' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Error al obtener producto:', error);
    res.status(500).json({ error: 'Error al obtener el producto.' });
  }
};

// Crear producto (Protegido por Admin) — la imagen es obligatoria
exports.createProduct = async (req, res) => {
  const { id, name, size, color, description, price, stock, category } = req.body;

  if (!name || !size || !color) {
    return res.status(400).json({ error: 'Nombre, talla y color son requeridos.' });
  }

  const finalCategory = VALID_CATEGORIES.includes(category) ? category : 'accesorios';

  if (!req.file) {
    return res.status(400).json({ error: 'La imagen del producto es obligatoria.' });
  }
  const image = req.file.path;
  const productId = id || 'p_' + Date.now().toString(36);

  try {
    await db.query(
      'INSERT INTO products (id, name, size, color, description, price, stock, image_url, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [productId, name, size, color, description || '', price || 0, stock || 0, image, finalCategory]
    );
    res.status(201).json({ message: 'Producto añadido con éxito', id: productId, image_url: image, category: finalCategory });
  } catch (error) {
    console.error('Error al añadir producto:', error);
    res.status(500).json({ error: 'Error al guardar el producto.' });
  }
};

// Actualizar producto (Protegido por Admin)
// Si llega una imagen nueva, reemplaza la anterior; si no, se conserva la que ya tenía.
exports.updateProduct = async (req, res) => {
  const { id } = req.params;
  const { name, size, color, description, price, stock, category } = req.body;
  const finalCategory = VALID_CATEGORIES.includes(category) ? category : 'accesorios';

  try {
    const [existingRows] = await db.query('SELECT image_url FROM products WHERE id = ?', [id]);
    if (existingRows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado.' });
    }

    const previousImage = existingRows[0].image_url;
    const newImage = req.file ? req.file.path : previousImage;

    await db.query(
      'UPDATE products SET name = ?, size = ?, color = ?, description = ?, price = ?, stock = ?, image_url = ?, category = ? WHERE id = ?',
      [name, size, color, description, price || 0, stock, newImage, finalCategory, id]
    );

    res.json({ message: 'Producto actualizado con éxito.', image_url: newImage, category: finalCategory });
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    res.status(500).json({ error: 'Error al actualizar producto.' });
  }
};

// Eliminar producto (Protegido por Admin)
exports.deleteProduct = async (req, res) => {
  const { id } = req.params;

  try {
    const [existingRows] = await db.query('SELECT image_url FROM products WHERE id = ?', [id]);
    if (existingRows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado.' });
    }

    await db.query('DELETE FROM products WHERE id = ?', [id]);

    res.json({ message: 'Producto eliminado con éxito.' });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({ error: 'Error al eliminar producto.' });
  }
};