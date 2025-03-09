const express = require('express');
const router = express.Router();
const manage_Order = require('../controllers/manage_Order'); 

router.get('/', manage_Order.getOrder); 
router.post('/', manage_Order.createOrder); 
router.put("/:id", manage_Order.updateOrderStatus);
router.delete("/:id", manage_Order.deleteOrder);
router.get("/sales-summary", manage_Order.getSalesSummary);
// router.get("/sales-data", manage_Order.getSalesData);

module.exports = router;
