const express = require("express");
const db = require('../db');
const app = express();
const cors = require("cors");
require('dotenv').config();
const axios = require("axios");

exports.createIngredient = async (req, res) => {
    try {
        console.log("📢 ข้อมูลที่ได้รับจาก React:", req.body); // ✅ Debug

        const { Ingredient_Name, Quantity, Low_stock_threshold } = req.body;

        if (!Ingredient_Name || Quantity === undefined || Low_stock_threshold === undefined) {
            return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบถ้วน" });
        }

        const sql = "INSERT INTO Ingredient (Ingredient_Name, Quantity, Low_stock_threshold) VALUES (?, ?, ?)";
        const [result] = await db.query(sql, [Ingredient_Name, Quantity, Low_stock_threshold]);

        res.status(201).json({ message: "เพิ่มวัตถุดิบสำเร็จ!", ingredientId: result.insertId });
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


exports.updateIngredient = async (req, res) => {
    try {
        const { id } = req.params;
        const { Ingredient_Name, Quantity, Low_stock_threshold } = req.body;

        if (!Ingredient_Name || Quantity === undefined || Low_stock_threshold === undefined) {
            return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบ" });
        }

        const sql = "UPDATE Ingredient SET Ingredient_Name = ?, Quantity = ?, Low_stock_threshold = ? WHERE Ingredient_ID = ?";
        await db.query(sql, [Ingredient_Name, Quantity, Low_stock_threshold, id]);

        res.status(200).json({ message: "อัปเดตวัตถุดิบสำเร็จ!" });
    } catch (error) {
        console.error("🚨 อัปเดตวัตถุดิบไม่สำเร็จ:", error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
    }
};

exports.deleteIngredient = async (req, res) => {
    try {
        const { id } = req.params;

        const sql = "DELETE FROM Ingredient WHERE Ingredient_ID = ?";
        await db.query(sql, [id]);

        res.status(200).json({ message: "ลบวัตถุดิบสำเร็จ!" });
    } catch (error) {
        console.error("🚨 ลบวัตถุดิบไม่สำเร็จ:", error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
    }
};
