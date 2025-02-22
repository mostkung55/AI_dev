const db = require("../db"); // นำเข้า database connection
const express = require("express");
const productController = require('../controllers/manage_Product');
const app = express();
const cors = require("cors");
const multer = require("multer");

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// CREATE: เพิ่มสินค้าใหม่
exports.createProduct = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "กรุณาอัปโหลดไฟล์รูปภาพ" });
        }

        const { name, price, description } = req.body;
        if (!name || !description || !price) {
            return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบถ้วน" });
        }

        const imagePath = `/uploads/${req.file.filename}`; // ✅ เก็บเส้นทางไฟล์รูป

        const sql = "INSERT INTO Product (Product_Name, Price, Description, Product_image) VALUES (?, ?, ?, ?)";
        const [result] = await db.query(sql, [name, price, description, imagePath]);

        res.status(201).json({ message: "เพิ่มสินค้าสำเร็จ!", productId: result.insertId });
    } catch (error) {
        console.error("🚨 เพิ่มสินค้าไม่สำเร็จ:", error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
    }
};


// READ: ดึงข้อมูลสินค้าทั้งหมด
exports.getAllProducts = async (req, res) => {
    try {
        const [products] = await db.query("SELECT * FROM Product");
        res.status(200).json(products)
    } catch (error) {
        console.log(error)
    }
    

};

// READ: ดึงข้อมูลสินค้าตาม ID
exports.getProductById = async (req, res) => {
     
    try {
        const { id } = req.params;
        const [product] = await db.query("SELECT * FROM Product WHERE Product_ID = ?", id);
       
        if (product.length === 0) {
            return res.status(404).json({ message: "Product not found" });
        }
        res.status(200).json(product[0]);
    } catch (error) {
        console.log(error)
    }
};

// UPDATE: อัปเดตข้อมูลสินค้า
exports.updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, price, description } = req.body;

        // 🔹 ดึงค่ารูปภาพปัจจุบันจากฐานข้อมูลก่อน
        const [existingProduct] = await db.query("SELECT Product_image FROM Product WHERE Product_ID = ?", [id]);

        if (existingProduct.length === 0) {
            return res.status(404).json({ message: "ไม่พบสินค้า" });
        }

        let imagePath = existingProduct[0].Product_image; // ใช้ค่ารูปเดิมถ้าไม่ได้อัปโหลดใหม่

        if (req.file) {
            imagePath = `/uploads/${req.file.filename}`; // ✅ ใช้รูปใหม่ถ้ามีการอัปโหลด
        }

        const sql = "UPDATE Product SET Product_Name = ?, Price = ?, Description = ?, Product_image = ? WHERE Product_ID = ?";
        const [product] = await db.query(sql, [name, price, description, imagePath, id]);

        if (product.affectedRows === 0) {
            return res.status(404).json({ message: "ไม่พบสินค้า" });
        }

        res.status(200).json({ message: "อัปเดตสินค้าสำเร็จ!", imagePath });

    } catch (error) {
        console.error("🚨 อัปเดตสินค้าไม่สำเร็จ:", error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
    }
};



// DELETE: ลบสินค้า
exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const [product] = await db.query("DELETE FROM Product WHERE Product_ID = ?", [id]);

        if (product.affectedRows === 0) {
            return res.status(404).json({ message: "Product not found" });
        }
        res.status(200).json({ message: "Product deleted successfully" });
        
    } catch (error) {
        console.log(error)
    }
    
};
