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
        console.log("🔎 Query Parameters:", req.query); // ✅ Debug

        const { ingredient_id } = req.query;

        if (!ingredient_id) {
            return res.status(400).json({ message: "กรุณาระบุ ingredient_id" });
        }

    
        const sql = `
            SELECT Ingredient_Item.*, 
                   DATE_FORMAT(CONVERT_TZ(Updated_at, '+00:00', '+07:00'), '%d/%m/%Y %H:%i:%s') AS Updated_at_local
            FROM Ingredient_Item 
            WHERE Ingredient_ID = ? 
            ORDER BY Updated_at ASC;
        `;

        const [ingredientItems] = await db.query(sql, [ingredient_id]);

        console.log("📢 ข้อมูลที่ดึงได้:", ingredientItems); // ✅ Debug

        res.status(200).json(ingredientItems);
    } catch (error) {
        console.error("🚨 ดึงข้อมูล IngredientItem ไม่สำเร็จ:", error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
    }
};






