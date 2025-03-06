const express = require("express");
const db = require('../db');
const app = express();
const cors = require("cors");
require('dotenv').config();
const axios = require("axios");
const line = require('@line/bot-sdk');

const config = {
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
    channelSecret: process.env.CHANNEL_SECRET,
};

const client = new line.Client(config);


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
const notifyCustomer = async (customerId, status) => {
    if (!customerId) {
        console.error("❌ ไม่มี Customer_ID สำหรับแจ้งเตือนลูกค้า");
        return;
    }

    console.log(`📢 แจ้งเตือนลูกค้า: ${customerId} สถานะใหม่: ${status}`);

    let message = "";
    switch (status) {
        case "Preparing":
            message = "✅ คำสั่งซื้อของคุณกำลังถูกเตรียม!";
            break;
        case "Delivering":
            message = "🚚 คำสั่งซื้อของคุณกำลังถูกจัดส่ง!";
            break;
        case "Completed":
            message = "🎉 คำสั่งซื้อของคุณถูกจัดส่งสำเร็จแล้ว! ขอบคุณที่ใช้บริการครับ 😊";
            break;
        case "Paid":
            message = "💰 คำสั่งซื้อของคุณถูกชำระเงินเรียบร้อยแล้ว!";
            break;
        default:
            message = `📢 คำสั่งซื้อของคุณเปลี่ยนสถานะเป็น: ${status}`;
    }

    try {
        await client.pushMessage(customerId, { type: "text", text: message });
        console.log(`✅ แจ้งเตือนลูกค้าสำเร็จ: ${customerId}`);
    } catch (error) {
        console.error("❌ Error sending notification to customer:", error);
    }
};

// 📌 PUT: อัปเดตสถานะของสินค้าใน Order Item และอัปเดตสถานะ Order
exports.updateItemStatus = async (req, res) => {
    const { orderItemId } = req.params;
    const { status } = req.body;

    try {
        console.log(`🔄 อัปเดตสถานะของ Order_ItemID: ${orderItemId} เป็น ${status}`);

        // ✅ อัปเดตสถานะของ Order Item
        await db.query("UPDATE Order_Item SET Status = ? WHERE Order_ItemID = ?", [status, orderItemId]);

        // ✅ ดึง Order ID ของ Order Item ที่อัปเดต
        const [orderData] = await db.query("SELECT Order_ID FROM Order_Item WHERE Order_ItemID = ?", [orderItemId]);
        if (orderData.length === 0) {
            return res.status(404).json({ error: "Order item not found" });
        }
        const orderId = orderData[0].Order_ID;

        // ✅ ดึง Customer_ID ของ Order
        const [customerData] = await db.query("SELECT Customer_ID FROM `Order` WHERE Order_ID = ?", [orderId]);
        if (customerData.length === 0) {
            return res.status(404).json({ error: "Customer not found" });
        }
        const customerId = customerData[0].Customer_ID;

        // ✅ ดึงสถานะของ Order Items ทั้งหมดในคำสั่งซื้อนั้น
        const [items] = await db.query("SELECT Status FROM Order_Item WHERE Order_ID = ?", [orderId]);
        const statuses = items.map(item => item.Status);
        console.log(`📢 สถานะทั้งหมดของ Order ${orderId}:`, statuses);

        // ✅ กำหนดสถานะใหม่ของ Order ตามสถานะของ Order Items
        let newOrderStatus = "Preparing";

        if (statuses.every(s => s === "Completed")) {
            newOrderStatus = "Completed";
        } else if (statuses.every(s => s === "Paid")) {
            newOrderStatus = "Paid";
        } else if (statuses.every(s => s === "Delivering")) {
            newOrderStatus = "Delivering";
        } else if (statuses.includes("Preparing")) {
            newOrderStatus = "Preparing";
        }

        console.log(`✅ อัปเดตสถานะของ Order ${orderId} เป็น ${newOrderStatus}`);
        
        // ✅ อัปเดตสถานะของ Order
        await db.query("UPDATE `Order` SET status = ? WHERE Order_ID = ?", [newOrderStatus, orderId]);

        // ✅ ส่งแจ้งเตือนลูกค้าเมื่อ **ทุก OrderItem เปลี่ยนสถานะเดียวกัน**
        if (statuses.every(s => s === newOrderStatus)) {
            await notifyCustomer(customerId, newOrderStatus);
        }

        res.status(200).json({ message: `✅ Order Item ${orderItemId} updated to ${status}, Order ${orderId} updated to ${newOrderStatus}` });
    } catch (err) {
        console.error("🚨 Error updating item status:", err);
        res.status(500).json({ error: "Failed to update item status" });
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

