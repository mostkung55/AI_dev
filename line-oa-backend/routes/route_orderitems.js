const express = require("express");
const router = express.Router();
const { getItem ,updateOrderStatus,updateItemStatus} = require("../controllers/manage_OrderItems");

// 📌 GET: ดึงรายการสินค้าใน Order ตาม Order_ID
router.get("/:orderId",getItem);

// 📌 PUT: อัปเดตสถานะสินค้าใน Order Items
router.put("/:orderItemId/status",updateItemStatus);

router.put("/orders/:orderId/status", updateOrderStatus);

/**
 * @swagger
 * tags:
 *   - name: Order Items
 *     description: Items within orders
 */

/**
 * @swagger
 * /api/order_items/{orderId}:
 *   get:
 *     summary: Get items in an order
 *     tags: [Order Items]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Items fetched
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/order_items/{orderItemId}/status:
 *   put:
 *     summary: Update item status
 *     tags: [Order Items]
 *     parameters:
 *       - in: path
 *         name: orderItemId
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
 *         description: Status updated
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/order_items/orders/{orderId}/status:
 *   put:
 *     summary: Update order status via order_items route
 *     tags: [Order Items]
 *     parameters:
 *       - in: path
 *         name: orderId
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
 *         description: Order status updated
 *       500:
 *         description: Internal server error
 */

module.exports = router;