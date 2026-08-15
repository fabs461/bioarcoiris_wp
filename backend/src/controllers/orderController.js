const db = require('../config/db');

// Crear pedido (público, desde el carrito del cliente)
exports.createOrder = async (req, res) => {
  const { full_name, phone, email, address, items, total } = req.body;

  if (!full_name || !phone || !email || !address) {
    return res.status(400).json({ error: 'Nombre completo, celular, email y dirección son requeridos.' });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'El pedido no tiene prendas.' });
  }

  // Recalculamos el total en el servidor a partir de los items recibidos,
  // en vez de confiar ciegamente en el total enviado por el cliente.
  const computedTotal = items.reduce((sum, it) => {
    const price = Number(it.price) || 0;
    const qty = Number(it.qty) || 0;
    return sum + price * qty;
  }, 0);

  try {
    const [result] = await db.query(
      'INSERT INTO orders (full_name, phone, email, address, items, total) VALUES (?, ?, ?, ?, ?, ?)',
      [full_name, phone, email, address, JSON.stringify(items), computedTotal]
    );
    res.status(201).json({ message: 'Pedido recibido con éxito.', id: result.insertId, total: computedTotal });
  } catch (error) {
    console.error('Error al crear pedido:', error);
    res.status(500).json({ error: 'Error al registrar el pedido.' });
  }
};

// Listar pedidos (protegido por Admin)
exports.getAllOrders = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM orders ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener pedidos:', error);
    res.status(500).json({ error: 'Error al obtener pedidos.' });
  }
};

// Eliminar pedido (protegido por Admin)
exports.deleteOrder = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.query('DELETE FROM orders WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Pedido no encontrado.' });
    }
    res.json({ message: 'Pedido eliminado con éxito.' });
  } catch (error) {
    console.error('Error al eliminar pedido:', error);
    res.status(500).json({ error: 'Error al eliminar el pedido.' });
  }
};

// Marcar pedido como concluido (protegido por Admin)
exports.completeOrder = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.query('UPDATE orders SET status = ? WHERE id = ?', ['concluido', id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Pedido no encontrado.' });
    }
    res.json({ message: 'Pedido marcado como concluido.' });
  } catch (error) {
    console.error('Error al concluir pedido:', error);
    res.status(500).json({ error: 'Error al actualizar el pedido.' });
  }
};

// Desmarcar pedido concluido — vuelve a pendiente (protegido por Admin)
exports.uncompleteOrder = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.query('UPDATE orders SET status = ? WHERE id = ?', ['pendiente', id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Pedido no encontrado.' });
    }
    res.json({ message: 'Pedido marcado como pendiente.' });
  } catch (error) {
    console.error('Error al desmarcar pedido:', error);
    res.status(500).json({ error: 'Error al actualizar el pedido.' });
  }
};