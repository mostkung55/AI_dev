require('dotenv').config();
const express = require('express');
const db = require('./db')
const line = require('@line/bot-sdk');
const route_product = require("./routes/route_product");
const axios = require("axios");
const app = express();
const cors = require('cors')
const cron = require("node-cron");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use('/api/products', route_product);
app.use("/uploads", express.static("uploads"));






const config = {
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
    channelSecret: process.env.CHANNEL_SECRET,
};

if (!config.channelAccessToken || !config.channelSecret) {
    throw new Error("Missing CHANNEL_ACCESS_TOKEN or CHANNEL_SECRET in .env file");
}




const client = new line.Client(config);

app.get('/', async (req, res) => {
    try {
        res.send('Hello, LINE OA is running!');
    } catch (error) {
        console.log(error)
    }

});




async function getUserProfile(userId) {
    try {
        const response = await axios.get(`https://api.line.me/v2/bot/profile/${userId}`, {
            headers: {
                "Authorization": `Bearer ${config.channelAccessToken}`
            }
        });
        return response.data;
    } catch (error) {
        console.error("🚨 Error getting user profile:", error);
        return null;
    }
}


app.post('/webhook', async (req, res) => {
    const events = req.body.events;

    for (let event of events) {
        if (event.type === 'message') { // 📩 เช็คว่าเป็นข้อความ
            const userId = event.source.userId;
            console.log("📩 New Message from:", userId);

            // ดึงชื่อจาก API LINE
            const profile = await getUserProfile(userId);

            if (profile) {
                const customerName = profile.displayName; // ใช้ชื่อจาก LINE
                const customerPhone = null; // ยังไม่มีข้อมูลเบอร์โทร
                const customerAddress = null; // ยังไม่มีที่อยู่


                // 📌 บันทึกข้อมูลเฉพาะ userId (Customer_id)
                await db.query(
                    'INSERT INTO Customer (Customer_ID, Customer_Name, Customer_Address, Customer_Phone) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE Customer_name = VALUES(Customer_name)',
                    [userId, customerName, customerPhone, customerAddress]
                );
            }
        }
    }
    res.sendStatus(200);
});

const sendProductMenuToLine = async () => {
    try {
        const flexMessage = await generateProductMenu();
        if (!flexMessage) {
            console.log("❌ ไม่มีสินค้าในระบบ");
            return;
        }

        const [recipients] = await db.query("SELECT Customer_ID FROM Customer"); // 🔹 เปลี่ยนเป็น User ID หรือ Broadcast
        await client.pushMessage(recipients, flexMessage);

        console.log("✅ ส่งเมนูสินค้าไปยัง LINE OA สำเร็จ!");
    } catch (error) {
        console.error("🚨 ไม่สามารถส่งเมนูไปยัง LINE OA:", error);
    }
};

// 🔹 ตั้งเวลาส่งเมนูสินค้าอัตโนมัติทุกวันเวลา 9 โมงเช้า
cron.schedule("0 9 * * *", () => {
    console.log("🔔 กำลังส่งเมนูสินค้าไปยัง LINE...");
    sendProductMenuToLine();
}, {
    timezone: "Asia/Bangkok"
});


(async () => {
    try {

        const [rows] = await db.query('SHOW TABLES;');
        console.log('Connected to Database. Tables:', rows);

    } catch (err) {

        console.error('Database connection error:', err);

    }
})();



const PORT = 3000;
app.listen(PORT, () => {
    console.log('Server is running on port 3000');
});

