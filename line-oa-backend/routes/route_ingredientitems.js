const express = require("express");
const router = express.Router();
const manage_IngredientItem = require("../controllers/manage_IngredientItem");


router.get("/", manage_IngredientItem.getIngredientItems);
router.put("/update-exp", manage_IngredientItem.updateExpDate);

/**
 * @swagger
 * tags:
 *   - name: Ingredient Items
 *     description: Tracking batches of ingredients
 */

/**
 * @swagger
 * /api/ingredientItems:
 *   get:
 *     summary: Get ingredient items
 *     tags: [Ingredient Items]
 *     responses:
 *       200:
 *         description: List of ingredient items      
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/ingredientItems/update-exp:
 *   put:
 *     summary: Update expiration date
 *     tags: [Ingredient Items]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               itemId:
 *                 type: integer
 *               newExpDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Updated
 *       500:
 *         description: Internal server error
 */

module.exports = router;
