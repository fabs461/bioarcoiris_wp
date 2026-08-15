const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const verifyToken = require('../middleware/authMiddleware');
const upload = require("../middleware/uploadMiddleware");

// Rutas públicas
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);

// Rutas protegidas (requieren token JWT de admin)
router.post(
    "/",
    verifyToken,
    upload.single("image"),
    productController.createProduct
);
router.put(
    "/:id",
    verifyToken,
    upload.single("image"),
    productController.updateProduct
);
router.delete('/:id', verifyToken, productController.deleteProduct);

module.exports = router;