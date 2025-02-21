require('dotenv').config();
const express = require('express');
const db = require('./db')
const line = require('@line/bot-sdk');
const route_product = require("./routes/route_product");
const axios = require("axios");
const app = express();
const cors = require('cors')
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


app.use("/api/products", route_product); // ใช้ routes ของสินค้า

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


async function handleEvent(event) {
    const userId = event.source.userId;

    if (event.type === 'follow') {
        const profile = await getUserProfile(userId);
        const customerName = profile ? profile.displayName : 'Unknown';

        const [rows] = await db.query('SELECT * FROM customers WHERE Customer_ID = ?', [userId]);
        if (rows.length === 0) {
            await db.query(
                'INSERT INTO customers (Customer_ID, Customer_Name) VALUES (?, ?)',
                [userId, customerName]
            );
            console.log(`Added new customer: ${userId}`);
        }

        return client.replyMessage({
            replyToken: event.replyToken,
            messages: [{ type: 'text', text: 'ยินดีต้อนรับ! กรุณาบอกที่อยู่ของคุณเพื่อให้เราบันทึกข้อมูล' }],
        });
    } else if (event.type === 'message' && event.message.type === 'text') {
        const userMessage = event.message.text;
        const [rows] = await db.query('SELECT * FROM customers WHERE Customer_ID = ?', [userId]);
        const customer = rows[0];

        if (!customer) {
            const profile = await getUserProfile(userId);
            const customerName = profile ? profile.displayName : 'Unknown';
            await db.query(
                'INSERT INTO customers (Customer_ID, Customer_Name) VALUES (?, ?)',
                [userId, customerName]
            );
            return client.replyMessage({
                replyToken: event.replyToken,
                messages: [{ type: 'text', text: 'ยินดีต้อนรับ! กรุณาบอกที่อยู่ของคุณ' }],
            });
        }

        if (!customer.Customer_Address) {
            await db.query('UPDATE customers SET Customer_Address = ? WHERE Customer_ID = ?', [userMessage, userId]);
            return client.replyMessage({
                replyToken: event.replyToken,
                messages: [{ type: 'text', text: 'บันทึกที่อยู่เรียบร้อยแล้ว! กรุณาบอกเบอร์โทรศัพท์ของคุณ' }],
            });
        } else if (!customer.Customer_Phone) {
            await db.query('UPDATE customers SET Customer_Phone = ? WHERE Customer_ID = ?', [userMessage, userId]);
            return client.replyMessage({
                replyToken: event.replyToken,
                messages: [{ type: 'text', text: 'บันทึกเบอร์โทรเรียบร้อยแล้ว! ข้อมูลของคุณครบถ้วนแล้ว' }],
            });
        } else {
            return client.replyMessage({
                replyToken: event.replyToken,
                messages: [{
                    type: 'text',
                    text: `ข้อมูลของคุณ:\nชื่อ: ${customer.Customer_Name}\nที่อยู่: ${customer.Customer_Address}\nโทร: ${customer.Customer_Phone}`,
                }],
            });
        }
    }

    return Promise.resolve(null);
}

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

