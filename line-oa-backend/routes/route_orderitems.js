const express = require("express");
const router = express.Router();
const { getItem ,updateOrderStatus,updateItemStatus} = require("../controllers/manage_OrderItems");

// 📌 GET: ดึงรายการสินค้าใน Order ตาม Order_ID
router.get("/:orderId",getItem);

// 📌 PUT: อัปเดตสถานะสินค้าใน Order Items
router.put("/:orderItemId/status",updateItemStatus);

router.put("/orders/:orderId/status", updateOrderStatus);

module.exports = router;