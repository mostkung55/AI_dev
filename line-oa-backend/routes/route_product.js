const express = require('express');
const router = express.Router();
const manage_Product = require('../controllers/manage_Product');

router.post("/", manage_Product.createProduct);
router.get("/", manage_Product.getAllProducts);
router.get("/:id", manage_Product.getProductById);
router.put("/:id", manage_Product.updateProduct);
router.delete("/:id", manage_Product.deleteProduct);


module.exports = router;