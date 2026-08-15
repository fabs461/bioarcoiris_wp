const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const verifyToken = require('../middleware/authMiddleware');
const { orderLimiter } = require('../middleware/rateLimiters');

// Ruta pública: el cliente envía su pedido desde el carrito
router.post('/', orderLimiter, orderController.createOrder);

// Ruta protegida: solo el administrador ve la lista de pedidos
router.get('/', verifyToken, orderController.getAllOrders);

// Rutas protegidas: solo el administrador puede eliminar, concluir o desmarcar pedidos
router.delete('/:id', verifyToken, orderController.deleteOrder);
router.patch('/:id/complete', verifyToken, orderController.completeOrder);
router.patch('/:id/uncomplete', verifyToken, orderController.uncompleteOrder);

module.exports = router;