const express = require("express");
const db = require('../db');
const app = express();
const cors = require("cors");
require('dotenv').config();
const axios = require("axios");


// GET: ดึงข้อมูลคำสั่งซื้อทั้งหมด
exports.getOrder = async (req, res) => {
  try {
    const [orders] = await db.query("SELECT * FROM `Order`"); // ✅ ใส่ Backtick (`) ป้องกัน Error
    res.status(200).json(orders);
  } catch (error) {
    console.error("🚨 ดึงข้อมูลคำสั่งซื้อไม่สำเร็จ:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
  }
};

// CREATE: เพิ่มคำสั่งซื้อใหม่
exports.createOrder = async (req, res) => {
  try {
    const { Customer_ID, Customer_Address, Total_Amount, Status } = req.body;

    const Created_at = new Date().toISOString().slice(0, 19).replace('T', ' ');

    if (!Customer_ID || !Customer_Address || !Total_Amount || !Status) {
      return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบถ้วน" });
    }

    const sql = "INSERT INTO `Order` (Customer_ID, Customer_Address, Total_Amount, Created_at, Status) VALUES (?, ?, ?, ?, ?)";
    const [result] = await db.query(sql, [Customer_ID, Customer_Address, Total_Amount, Created_at, Status]);

    res.status(201).json({ message: "เพิ่มคำสั่งซื้อสำเร็จ!", orderId: result.insertId });
  } catch (error) {
    console.error("🚨 เพิ่มคำสั่งซื้อไม่สำเร็จ:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
  }
};


exports.updateOrderStatus = async (req, res) => {
    try {
      const { id } = req.params;
      const { Status } = req.body;
  
      if (!Status) {
        return res.status(400).json({ message: "กรุณาส่งค่าของสถานะ (Status)" });
      }
  
      const sql = "UPDATE `Order` SET Status = ? WHERE Order_ID = ?";
      await db.query(sql, [Status, id]);
  
      res.status(200).json({ message: "อัปเดตสถานะสำเร็จ!" });
    } catch (error) {
      console.error("🚨 Error updating order status:", error);
      res.status(500).json({ message: "เกิดข้อผิดพลาดในการอัปเดตสถานะ" });
    }
  };

  // DELETE: ลบคำสั่งซื้อ
exports.deleteOrder = async (req, res) => {
    try {
      const { id } = req.params;
  
      if (!id) {
        return res.status(400).json({ message: "กรุณาระบุ Order_ID ที่ต้องการลบ" });
      }
  
      const sql = "DELETE FROM `Order` WHERE Order_ID = ?";
      const [result] = await db.query(sql, [id]);
  
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "ไม่พบคำสั่งซื้อที่ต้องการลบ" });
      }
  
      res.status(200).json({ message: "ลบคำสั่งซื้อสำเร็จ!" });
    } catch (error) {
      console.error("🚨 Error deleting order:", error);
      res.status(500).json({ message: "เกิดข้อผิดพลาดในการลบคำสั่งซื้อ" });
    }
  };
  