const express = require('express');
const router = express.Router();
const manage_Ingredient = require('../controllers/manage_Ingredient'); 
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

router.post("/upload-slip", upload.single("image"), manage_Ingredient.uploadReceiptSlip);
router.get("/", manage_Ingredient.getIngredients);  
router.delete("/:id", manage_Ingredient.deleteIngredient); 


module.exports = router;
