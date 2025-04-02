const express = require('express');
const router = express.Router();
const manage_Ingredient = require('../controllers/manage_Ingredient'); 
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

router.post("/upload-slip", upload.single("image"), manage_Ingredient.uploadReceiptSlip);
router.get("/", manage_Ingredient.getIngredients);  
router.delete("/:id", manage_Ingredient.deleteIngredient); 

/**
 * @swagger
 * tags:
 *   - name: Ingredients
 *     description: Ingredient definitions
 */

/**
 * @swagger
 * /api/ingredient:
 *   get:
 *     summary: Get all ingredients
 *     tags: [Ingredients]
 *     responses:
 *       200:
 *         description: List of ingredients
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/ingredient/{id}:
 *   delete:
 *     summary: Delete an ingredient
 *     tags: [Ingredients]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Deleted
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/ingredient/upload-slip:
 *   post:
 *     summary: Upload receipt slip for ingredients
 *     tags: [Ingredients]
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Slip uploaded
 *       500:
 *         description: Internal server error
 */


module.exports = router;
