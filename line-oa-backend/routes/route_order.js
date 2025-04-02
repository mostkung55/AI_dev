const express = require('express');
const router = express.Router();
const manage_Order = require('../controllers/manage_Order'); 

router.get('/', manage_Order.getOrder); 
router.post('/', manage_Order.createOrder); 
router.put("/:id", manage_Order.updateOrderStatus);
router.delete("/:id", manage_Order.deleteOrder);

/**
 * @swagger
 * tags:
 *   - name: Orders
 *     description: Order management
 */

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Get all orders
 *     tags: [Orders]
 *     responses:
 *       200:
 *         description: List of orders
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create an order
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               Customer_ID:
 *                 type: string
 *               Total_Amount:
 *                 type: number
 *     responses:
 *       201:
 *         description: Order created
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/orders/{id}:
 *   put:
 *     summary: Update order status
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               Status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order updated
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/orders/{id}:
 *   delete:
 *     summary: Delete an order
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Order deleted
 *       500:
 *         description: Internal server error
 */

module.exports = router;
