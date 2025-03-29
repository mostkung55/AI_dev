const db = require("../db");
const express = require("express");
const app = express();
const cors = require("cors");
const multer = require("multer");
const line = require('@line/bot-sdk');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


const config = {
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
    channelSecret: process.env.CHANNEL_SECRET,
};
const client = new line.Client(config);


// CREATE: เพิ่มสินค้าใหม่
exports.createProduct = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "กรุณาอัปโหลดไฟล์รูปภาพ" });
        }

        const { name, price, description, ingredients } = req.body;
        if (!name || !description || !price || !ingredients) {
            return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบถ้วน" });
        }

        const imagePath = `/uploads/${req.file.filename}`;
        const ingredientsJson = JSON.stringify(ingredients); //  แปลง JSON ก่อนบันทึก

        const sql = "INSERT INTO Product (Product_Name, Price, Description, Product_image, Ingredients) VALUES (?, ?, ?, ?, ?)";
        const [result] = await db.query(sql, [name, price, description, imagePath, ingredientsJson]);

        res.status(201).json({ message: "เพิ่มสินค้าสำเร็จ!", productId: result.insertId });
    } catch (error) {
        console.error("🚨 เพิ่มสินค้าไม่สำเร็จ:", error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
    }
};


// READ: ดึงข้อมูลสินค้าทั้งหมด
exports.getAllProducts = async (req, res) => {
    try {
        const sql = "SELECT * FROM Product";
        const [products] = await db.query(sql);

        //  ตรวจสอบค่า Ingredients ก่อน `JSON.parse()`
        const updatedProducts = products.map(p => {
            console.log("🔍 ค่าที่ได้จาก Database:", p.Ingredients);

            let ingredientsArray = [];

            if (p.Ingredients) {
                if (typeof p.Ingredients === "string") {
                    try {
                        ingredientsArray = JSON.parse(p.Ingredients); //  แปลงเฉพาะถ้าเป็น String
                    } catch (error) {
                        console.error("🚨 JSON Parse Error:", error);
                    }
                } else if (typeof p.Ingredients === "object") {
                    ingredientsArray = p.Ingredients; //  ถ้าเป็น Object อยู่แล้ว ไม่ต้องแปลง
                }
            }

            return {
                ...p,
                Ingredients: ingredientsArray
            };
        });

        res.status(200).json(updatedProducts);
    } catch (error) {
        console.error("🚨 ดึงข้อมูลสินค้าไม่สำเร็จ:", error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
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
        const { name, price, description, ingredients } = req.body; //  รับ ingredients จาก request

        // 🔹 ดึงค่ารูปภาพปัจจุบันจากฐานข้อมูลก่อน
        const [existingProduct] = await db.query("SELECT Product_image FROM Product WHERE Product_ID = ?", [id]);

        if (existingProduct.length === 0) {
            return res.status(404).json({ message: "ไม่พบสินค้า" });
        }

        let imagePath = existingProduct[0].Product_image; // ใช้ค่ารูปเดิมถ้าไม่ได้อัปโหลดใหม่

        if (req.file) {
            imagePath = `/uploads/${req.file.filename}`; //  ใช้รูปใหม่ถ้ามีการอัปโหลด
        }

        //  แปลง Ingredients เป็น JSON String
        const ingredientsJSON = ingredients ? JSON.stringify(JSON.parse(ingredients)) : null;

        //  อัปเดตข้อมูลสินค้า
        const sql = "UPDATE Product SET Product_Name = ?, Price = ?, Description = ?, Product_image = ?, Ingredients = ? WHERE Product_ID = ?";
        const [product] = await db.query(sql, [name, price, description, imagePath, ingredientsJSON, id]);

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

exports.generateProductMenu = async () => {
    try {
        const [products] = await db.query("SELECT Product_Name, Price, Description, Product_image FROM Product LIMIT 6");

        if (products.length === 0) {
            return null; //  ถ้าไม่มีสินค้าให้คืนค่า `null`
        }

        //  สร้าง Flex Message
        const flexMessage = {
            type: "flex",
            altText: "เมนูสินค้าใหม่วันนี้",
            contents: {
                type: "carousel",
                contents: products.map(product => ({
                    type: "bubble",
                    hero: {
                        type: "image",
                        url: `https://9d33-58-8-92-226.ngrok-free.app${product.Product_image}`,
                        size: "full",
                        aspectRatio: "20:13",
                        aspectMode: "cover"
                    },
                    body: {
                        type: "box",
                        layout: "vertical",
                        contents: [
                            {
                                type: "text",
                                text: product.Product_Name,
                                weight: "bold",
                                size: "xl"
                            },
                            {
                                type: "text",
                                text: `฿${product.Price}`,
                                size: "md",
                                color: "#FF0000"
                            },
                            {
                                type: "text",
                                text: product.Description,
                                size: "sm",
                                wrap: true,
                                color: "#666666"
                            }
                        ]
                    }
                }))
            }
        };

        return flexMessage;
    } catch (error) {
        console.error("🚨 ไม่สามารถสร้างเมนูสินค้าได้:", error);
        return null;
    }
};

exports.sendProductsToLine = async (req, res = null) => {
    try {
        console.log("✅ sendProductsToLine ถูกเรียกใช้งาน");

        const flexMessage = await exports.generateProductMenu();
        if (!flexMessage) {
            console.log("❌ ไม่มีสินค้า");
            return res.status(404).json({ message: "❌ ไม่มีสินค้าในระบบ" });
        }

        console.log("📤 กำลังส่งเมนูไปยัง LINE OA...");

        const [recipients] = await db.query("SELECT Customer_ID FROM Customer");

        if (!recipients || recipients.length === 0) {
            console.log("❌ ไม่มีลูกค้าในระบบ");
            return res.status(404).json({ message: "❌ ไม่มีลูกค้าในระบบ" });
        }

        //  ส่งเมนูให้ลูกค้าทุกคน
        for (const recipient of recipients) {
            console.log(`📤 ส่งถึง: ${recipient.Customer_ID}`);
            await client.pushMessage(recipient.Customer_ID, flexMessage);
        }

        console.log("✅ ส่งเมนูสินค้าไปยัง LINE OA สำเร็จ!");
        res.status(200).json({ message: "✅ ส่งสินค้าไปยัง LINE สำเร็จ!" });
    } catch (error) {
        console.error("🚨 ไม่สามารถส่งสินค้าได้:", error);
        res.status(500).json({ message: "❌ ไม่สามารถส่งสินค้าไปยัง LINE" });
    }
};