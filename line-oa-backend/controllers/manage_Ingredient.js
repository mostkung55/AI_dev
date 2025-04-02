const express = require("express");
const db = require('../db');
const app = express();
const cors = require("cors");
require('dotenv').config();
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const { error } = require("console");

// POST: อัปโหลดภาพใบเสร็จและเพิ่ม stock
exports.uploadReceiptSlip = async (req, res) => {
    const imagePath = req.file.path;
    const scriptPath = path.join(__dirname, "..", "model", "run_gemini.py");
    const python = spawn("python", [scriptPath, imagePath]);

    let stdout = "";
    let stderr = "";

    python.stdout.on("data", (data) => {
        stdout += data.toString();
    });

    python.stderr.on("data", (data) => {
        stderr += data.toString();
    });

    python.on("close", async (code) => {
        if (code !== 0) {
            console.error("❌ Python Error:", stderr.slice(0, 1000));
            return res.status(500).json({ message: "เกิดข้อผิดพลาดจาก Python" });
        }

        try {
            const jsonStart = stdout.indexOf("{");
            if (jsonStart === -1) throw new Error("No JSON found in output");

            const cleaned = stdout.slice(jsonStart).replace(/```json|```/g, "").trim();
            const data = JSON.parse(cleaned);

            const { date, detail } = data;
            const insertResults = [];

            //  อัตราคูณจากน้ำหนัก → จำนวนชิ้น
            const weightToPieceMap = {
                "ขนมปัง" : 15,
                "ไก่": 12,
                "กุ้ง": 30,
                "ปูอัด": 20,
                "เบค่อน": 15,
                "แฮม": 20,
                "ไข่" : 20,
                "ชีส" : 10,
                "ผัก" : 10,

            };

            for (const item of detail) {
                const { name, quantity, price } = item;

                // แปลงหน่วยถ้าจำเป็น
                let finalQuantity = Number(quantity);
                if (weightToPieceMap[name]) {
                    finalQuantity = Number(quantity) * weightToPieceMap[name];
                }

                // ✅ ค้นหาวัตถุดิบ
                const [existingIngredient] = await db.query(
                    "SELECT Ingredient_ID, Quantity FROM Ingredient WHERE Ingredient_Name = ?",
                    [name]
                );

                let ingredientId;
                if (existingIngredient.length > 0) {
                    ingredientId = existingIngredient[0].Ingredient_ID;
                    const newTotalQuantity = Number(existingIngredient[0].Quantity) + finalQuantity;

                    await db.query(
                        "UPDATE Ingredient SET Quantity = ? WHERE Ingredient_ID = ?",
                        [newTotalQuantity, ingredientId]
                    );
                } else {
                    const insertIngredientSql = `
                        INSERT INTO Ingredient (Ingredient_Name, Quantity, Low_stock_threshold)
                        VALUES (?, ?, ?)
                    `;
                    const [result] = await db.query(insertIngredientSql, [name, finalQuantity, 1]);
                    ingredientId = result.insertId;
                }

                // ✅ เพิ่มลง Ingredient_Item
                const batchCode = `BATCH-${ingredientId}-${Date.now()}`;
                const insertItemSql = `
                    INSERT INTO Ingredient_Item (Ingredient_ID, Batch_code, Quantity, Price, Updated_at)
                    VALUES (?, ?, ?, ?, NOW())
                `;
                await db.query(insertItemSql, [ingredientId, batchCode, finalQuantity, price, date]);

                insertResults.push({ name, quantity: finalQuantity, price, ingredientId });
            }

            return res.status(201).json({
                message: "✅ เพิ่มวัตถุดิบจากใบเสร็จสำเร็จ",
                inserted: insertResults,
            });

        } catch (err) {
            console.error("❌ JSON Parse or DB Error:", err);
            console.log("📤 Raw Output:", stdout);
            return res.status(500).json({ message: "ไม่สามารถแปลงผลลัพธ์จาก Gemini เป็น JSON ได้", error });
        }
    });
};




exports.getIngredients = async (req, res) => {
    try {
        const sql = `
            SELECT 
                i.Ingredient_ID, 
                i.Ingredient_Name, 
                i.Quantity, 
                i.Low_stock_threshold,
                (SELECT Price FROM Ingredient_Item WHERE Ingredient_ID = i.Ingredient_ID LIMIT 1) AS Price
            FROM Ingredient i
        `;
        const [ingredients] = await db.query(sql);

        const updatedIngredients = ingredients.map(ingre => ({
            ...ingre,
            Quantity: Number(ingre.Quantity),
            Low_stock_threshold: Number(ingre.Low_stock_threshold),
            isLowStock: Number(ingre.Quantity) < Number(ingre.Low_stock_threshold),
            Price: Number(ingre.Price) || 0
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

        //  ลบจาก Ingredient_Item ก่อน
        const sqlDeleteItems = "DELETE FROM Ingredient_Item WHERE Ingredient_ID = ?";
        await db.query(sqlDeleteItems, [id]);

        //  ลบจาก Ingredient
        const sqlDeleteIngredient = "DELETE FROM Ingredient WHERE Ingredient_ID = ?";
        await db.query(sqlDeleteIngredient, [id]);

        res.status(200).json({ message: "ลบวัตถุดิบสำเร็จ!" });
    } catch (error) {
        console.error("🚨 ลบวัตถุดิบไม่สำเร็จ:", error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
    }
};



