const express = require('express');
const router = express.Router();
const manage_Order = require('../controllers/manage_Order'); 

router.get('/', manage_Order.getOrder); 
router.post('/', manage_Order.createOrder); 
router.put("/:id", manage_Order.updateOrderStatus);
router.delete("/:id", manage_Order.deleteOrder);


module.exports = router;
