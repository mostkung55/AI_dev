const express = require("express");
const db = require('../db');
const app = express();
const cors = require("cors");
require('dotenv').config();
const axios = require("axios");

exports.createIngredient = async (req, res) => {
    try {
        console.log("📢 ข้อมูลที่ได้รับจาก React:", req.body);

        const { Ingredient_Name, Quantity, Low_stock_threshold, EXP_date } = req.body;

        if (!Ingredient_Name || Quantity === undefined || Low_stock_threshold === undefined || !EXP_date) {
            return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบถ้วน" });
        }

        // ✅ ตรวจสอบว่า Ingredient มีอยู่แล้วหรือไม่
        const [existingIngredient] = await db.query(
            "SELECT Ingredient_ID, Quantity FROM Ingredient WHERE Ingredient_Name = ?",
            [Ingredient_Name]
        );

        let ingredientId;
        if (existingIngredient.length > 0) {
            // 🟢 ถ้ามีอยู่แล้ว บวก Quantity เข้าไป (ใช้ Number() แปลงค่าก่อน)
            ingredientId = existingIngredient[0].Ingredient_ID;
            const newTotalQuantity = Number(existingIngredient[0].Quantity) + Number(Quantity);

            await db.query(
                "UPDATE Ingredient SET Quantity = ? WHERE Ingredient_ID = ?",
                [newTotalQuantity, ingredientId]
            );
        } else {
            // 🔵 ถ้ายังไม่มี ให้เพิ่มวัตถุดิบใหม่เข้า Ingredient
            const sqlInsertIngredient = "INSERT INTO Ingredient (Ingredient_Name, Quantity, Low_stock_threshold) VALUES (?, ?, ?)";
            const [result] = await db.query(sqlInsertIngredient, [Ingredient_Name, Quantity, Low_stock_threshold]);
            ingredientId = result.insertId;
        }

        // ✅ เพิ่มล็อตใหม่ใน Ingredient_Item
        const batchCode = `BATCH-${ingredientId}-${Date.now()}`;
        const sqlInsertBatch = "INSERT INTO Ingredient_Item (Ingredient_ID, Batch_code, Quantity, EXP_date, Updated_at) VALUES (?, ?, ?, ?, NOW())";
        await db.query(sqlInsertBatch, [ingredientId, batchCode, Quantity, EXP_date]);

        res.status(201).json({ message: "เพิ่มวัตถุดิบสำเร็จ!", ingredientId });

    } catch (error) {
        console.error("🚨 เพิ่มวัตถุดิบไม่สำเร็จ:", error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
    }
};




exports.getIngredients = async (req, res) => {
    try {
        const sql = "SELECT Ingredient_ID, Ingredient_Name, Quantity, Low_stock_threshold FROM Ingredient";
        const [ingredients] = await db.query(sql);

        // ✅ แปลงค่าทุกตัวเป็น number เพื่อให้แน่ใจว่าคำนวณถูกต้อง
        const updatedIngredients = ingredients.map(ingre => ({
            ...ingre,
            Quantity: Number(ingre.Quantity), // ✅ แปลงให้แน่ใจว่าเป็นตัวเลข
            Low_stock_threshold: Number(ingre.Low_stock_threshold),
            isLowStock: Number(ingre.Quantity) < Number(ingre.Low_stock_threshold),
        }));

        console.log("ข้อมูลที่ส่งไป React:", updatedIngredients);
        res.status(200).json(updatedIngredients);
    } catch (error) {
        console.error("🚨 ดึงข้อมูลวัตถุดิบไม่สำเร็จ:", error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
    }
};




exports.deleteIngredient = async (req, res) => {
    try {
        const { id } = req.params;

        // ✅ ลบจาก Ingredient_Item ก่อน
        const sqlDeleteItems = "DELETE FROM Ingredient_Item WHERE Ingredient_ID = ?";
        await db.query(sqlDeleteItems, [id]);

        // ✅ ลบจาก Ingredient
        const sqlDeleteIngredient = "DELETE FROM Ingredient WHERE Ingredient_ID = ?";
        await db.query(sqlDeleteIngredient, [id]);

        res.status(200).json({ message: "ลบวัตถุดิบสำเร็จ!" });
    } catch (error) {
        console.error("🚨 ลบวัตถุดิบไม่สำเร็จ:", error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
    }
};


