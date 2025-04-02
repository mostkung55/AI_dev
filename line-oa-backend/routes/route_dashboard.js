const express = require('express');
const router = express.Router();
const dashboardControl = require('../controllers/DashboardControl');

router.get('/sales-summary', dashboardControl.getSalesSummary);
router.get('/sales-data', dashboardControl.getSalesData);

/**
 * @swagger
 * tags:
 *   - name: Dashboard
 *     description: Sales analytics & summary
 */

/**
 * @swagger
 * /api/dashboard/sales-summary:
 *   get:
 *     summary: Get sales summary
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Summary data
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/dashboard/sales-data:
 *   get:
 *     summary: Get sales chart data
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Chart data
 *       500:
 *         description: Internal server error
 */

module.exports = router;
