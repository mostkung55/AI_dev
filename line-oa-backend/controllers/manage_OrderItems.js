const express = require("express");
const db = require('../db');
const app = express();
const cors = require("cors");
require('dotenv').config();
const axios = require("axios");

// 📌 GET: ดึงรายการสินค้าใน Order ตาม Order_ID
exports.getItem = async (req, res) => {
    try {
        const { orderId } = req.params;
        if (!orderId) {
            return res.status(400).json({ message: "กรุณาระบุ Order_ID" });
        }

        const [items] = await db.query(`
            SELECT Product.Product_name, 
                   Product.Price, 
                   Order_Item.Quantity, 
                   (Product.Price * Order_Item.Quantity) AS Subtotal,
                   Order_Item.Status,
                   Order_Item.Order_ItemID
            FROM Order_Item
            JOIN Product ON Order_Item.Product_ID = Product.Product_ID
            WHERE Order_Item.Order_ID = ?`, [orderId]); 
        
        console.log("📢 Order Items:", items);
        res.status(200).json(items);
    } catch (error) {
        console.error("🚨 Error fetching order items:", error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
    }
};

// 📌 PUT: อัปเดตสถานะของสินค้าใน Order Item และอัปเดตสถานะ Order
exports.updateItemStatus = async (req, res) => {
    try {
        const { orderItemId } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ message: "กรุณาระบุ Status" });
        }

        console.log(`🔄 กำลังเปลี่ยนสถานะ Order_ItemID: ${orderItemId} เป็น ${status}`);

        // ✅ อัปเดต Status ของ Order Item
        await db.query("UPDATE Order_Item SET Status = ? WHERE Order_ItemID = ?", [status, orderItemId]);

        // ✅ ดึง Order_ID ที่เกี่ยวข้องกับ Order_Item นี้
        const [orderData] = await db.query("SELECT Order_ID FROM Order_Item WHERE Order_ItemID = ?", [orderItemId]);
        if (!orderData.length) {
            return res.status(404).json({ message: "Order Item ไม่พบ" });
        }
        const orderId = orderData[0].Order_ID;

        // ✅ ตรวจสอบ Status ของทุก Order_Item ใน Order_ID นี้
        const [items] = await db.query("SELECT Status FROM Order_Item WHERE Order_ID = ?", [orderId]);
        console.log("📢 สถานะของ Order Items:", items);

        // ✅ ถ้าทุก `Order_Item` เป็น "Completed" หรือ "Paid" → เปลี่ยน `Order` เป็น "Completed"
        const allCompletedOrPaid = items.every(item => item.Status === "Completed" || item.Status === "Paid");

        if (allCompletedOrPaid) {
            await db.query("UPDATE `Order` SET Status = 'Completed' WHERE Order_ID = ?", [orderId]);
        } else {
            // ✅ ถ้ามีรายการที่เป็น "Paid" → `Order.Status` เป็น "Paid"
            const hasPaid = items.some(item => item.Status === "Paid");
            if (hasPaid) {
                await db.query("UPDATE `Order` SET Status = 'Paid' WHERE Order_ID = ?", [orderId]);
            } else {
                // ✅ ถ้ามีรายการที่เป็น "Delivering" → `Order.Status` เป็น "Delivering"
                const hasDelivering = items.some(item => item.Status === "Delivering");
                if (hasDelivering) {
                    await db.query("UPDATE `Order` SET Status = 'Delivering' WHERE Order_ID = ?", [orderId]);
                } else {
                    // ✅ ถ้าไม่มี "Delivering" หรือ "Paid" แต่มี "Preparing" → `Order.Status` เป็น "Preparing"
                    await db.query("UPDATE `Order` SET Status = 'Preparing' WHERE Order_ID = ?", [orderId]);
                }
            }
        }

        res.status(200).json({ message: `✅ อัปเดตสถานะ Order Item ${orderItemId} เป็น ${status} และตรวจสอบ Order สำเร็จ!` });
    } catch (error) {
        console.error("🚨 Error updating item status:", error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการอัปเดตสถานะ" });
    }
};


// 📌 PUT: อัปเดตสถานะของ Order
exports.updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ message: "กรุณาระบุ Status" });
        }

        // ✅ อัปเดต Status ของ Order
        await db.query("UPDATE `Order` SET Status = ? WHERE Order_ID = ?", [status, orderId]);

        res.status(200).json({ message: `✅ อัปเดตสถานะ Order ${orderId} เป็น ${status} สำเร็จ!` });
    } catch (error) {
        console.error("🚨 Error updating order status:", error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการอัปเดตสถานะของ Order" });
    }
};
