const express = require("express");
const db = require('../db');
const app = express();
const cors = require("cors");
require('dotenv').config();
const axios = require("axios");
const line = require('@line/bot-sdk');

const moment = require("moment-timezone");

exports.getIngredientItems = async (req, res) => {
    try {
        console.log("🔎 Query Parameters:", req.query);

        const { ingredient_id } = req.query;

        if (!ingredient_id) {
            return res.status(400).json({ message: "กรุณาระบุ ingredient_id" });
        }

        const sql = `
            SELECT 
                Ingredient_Item.*, 
                DATE_FORMAT(CONVERT_TZ(Updated_at, '+00:00', '+07:00'), '%d/%m/%Y %H:%i:%s') AS Updated_at_local
            FROM Ingredient_Item 
            WHERE Ingredient_ID = ? 
            ORDER BY Updated_at ASC;
        `;

        const [ingredientItems] = await db.query(sql, [ingredient_id]);

        //  ตรวจสอบว่ามี Price หรือไม่
        const result = ingredientItems.map(item => ({
            ...item,
            Price: Number(item.Price) || 0
        }));

        console.log("📢 ข้อมูลที่ดึงได้:", result);

        res.status(200).json(result);
    } catch (error) {
        console.error("🚨 ดึงข้อมูล IngredientItem ไม่สำเร็จ:", error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
    }
};

exports.updateExpDate = async (req, res) => {
    const { batch_code, exp_date } = req.body;
    if (!batch_code || !exp_date) {
        return res.status(400).json({ message: "กรุณาระบุ batch_code และ exp_date" });
    }

    try {
        const sql = `UPDATE Ingredient_Item SET EXP_date = ? WHERE Batch_code = ?`;
        await db.query(sql, [exp_date, batch_code]);
        res.status(200).json({ message: "อัปเดตวันหมดอายุสำเร็จ" });
    } catch (err) {
        console.error("❌ อัปเดตวันหมดอายุล้มเหลว:", err);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการอัปเดต" });
    }
};








