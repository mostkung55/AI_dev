const express = require('express');
const router = express.Router();
const dashboardControl = require('../controllers/DashboardControl');

router.get('/sales-summary', dashboardControl.getSalesSummary);
router.get('/sales-data', dashboardControl.getSalesData);

module.exports = router;
