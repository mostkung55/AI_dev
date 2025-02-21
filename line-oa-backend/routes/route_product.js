const express = require('express');
const router = express.Router();
const manage_Product = require('../controllers/manage_Product');
const multer = require("multer");

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    },
});
const upload = multer({ storage });


router.post("/", upload.single("Product_image"), manage_Product.createProduct);
router.get("/", manage_Product.getAllProducts);
router.get("/:id", manage_Product.getProductById);
router.put("/:id", manage_Product.updateProduct);
router.delete("/:id", manage_Product.deleteProduct);


module.exports = router;