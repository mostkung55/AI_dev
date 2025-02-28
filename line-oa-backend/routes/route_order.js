const express = require('express');
const router = express.Router();
const manage_Order = require('../controllers/manage_Order'); 

router.get('/', manage_Order.getOrder); // ✅ เปลี่ยน path เป็น `/orders`
router.post('/', manage_Order.createOrder); // ✅ เพิ่ม route POST
router.put("/:id", manage_Order.updateOrderStatus);

module.exports = router;
