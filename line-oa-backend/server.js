require('dotenv').config();
const express = require('express');
const db = require('./db')
const line = require('@line/bot-sdk');
const route_product = require("./routes/route_product");
const axios = require("axios");
const app = express();
const cors = require('cors')
const cron = require("node-cron");
const { sendProductsToLine } = require("./controllers/manage_Product");
const route_order = require('./routes/route_order')
const path = require("path");
const { exec } = require("child_process");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use('/api/products', route_product);
app.use("/uploads", express.static("uploads"));
app.use("/api/orders", route_order);





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


app.post("/webhook", async (req, res) => {
    const events = req.body.events;

    for (let event of events) {
        if (event.type === "message" && event.message.type === "text") {
            let customerId = event.source.userId;
            let customerText = event.message.text;
            let customerName = "ลูกค้า";

            // ดึงข้อมูลโปรไฟล์ลูกค้า
            const profile = await getUserProfile(customerId);
            if (profile) {
                customerName = profile.displayName;
            }

            try {
                await db.query(
                    `INSERT INTO Customer (Customer_ID, Customer_Name) VALUES (?, ?) ON DUPLICATE KEY UPDATE Customer_Name = VALUES(Customer_Name)`,
                    [customerId, customerName]
                );

                // เรียกใช้งานโมเดล Python เพื่อตรวจจับออเดอร์
                const modelPath = path.join(__dirname, "..", "model", "model.py");
                exec(`python "${modelPath}" "${customerText}"`, async (error, stdout) => {
                    if (error) {
                        console.error("❌ Error running model:", error);
                        return;
                    }

                    let orders = JSON.parse(stdout);
                    if (orders.length === 0) {
                        await client.replyMessage(event.replyToken, { type: "text", text: "❌ ไม่พบสินค้าที่ตรงกับคำสั่งของคุณ" });
                        return;
                    }

                    let totalAmount = 0;
                    for (let order of orders) {
                        const [rows] = await db.query(
                            "SELECT Price FROM Product WHERE Product_ID = ?",
                            [order.Product_ID]
                        );
                        if (!rows.length) continue;
                        let price = parseFloat(rows[0].Price);
                        let subtotal = price * order.quantity;
                        totalAmount += subtotal;
                    }

                    // บันทึกข้อมูลคำสั่งซื้อ
                    const [orderResult] = await db.query(
                        "INSERT INTO `Order` (Customer_ID, Total_Amount,Customer_Address, Status) VALUES (?, ?, ? , 'Preparing')",
                        [customerId, totalAmount, "ที่อยู่ลูกค้า (อัปเดตทีหลัง)"]
                    );
                    const orderId = orderResult.insertId;

                    for (let order of orders) {
                        const [rows] = await db.query(
                            "SELECT Price FROM Product WHERE Product_ID = ?",
                            [order.product_id]
                        );
                        if (!rows.length) continue;
                        let price = parseFloat(rows[0].Price);
                        let subtotal = price * order.Quantity;

                        await db.query(
                            "INSERT INTO Order_item (Order_ID, Product_ID, Quantity, Subtotal, Status) VALUES (?, ?, ?, ?, 'Preparing')",
                            [orderId, order.product_id, quantity, subtotal]
                        );
                    }



                
                    // ตอบกลับลูกค้า
                    let replyText = "📦 คำสั่งซื้อของคุณ:\n";
                    orders.forEach(Order => {
                        replyText += `✅ ${Order.menu} จำนวน ${Order.quantity} ชิ้น\n`;
                    });
                    replyText += `💰 ยอดรวม: ${totalAmount} บาท`;
                    await client.replyMessage(event.replyToken, { type: "text", text: replyText });
                });
            } catch (error) {
                console.error("🚨 Error processing order:", error);
            }
        }
    }

    res.sendStatus(200);
});



// const sendProductMenuToLine = async () => {
//     try {
//         const flexMessage = await generateProductMenu();
//         if (!flexMessage) {
//             console.log("❌ ไม่มีสินค้าในระบบ");
//             return;
//         }


//         const [recipients] = await db.query("SELECT Customer_ID FROM Customer"); 
//         await client.pushMessage(recipients, flexMessage);

//         console.log("✅ ส่งเมนูสินค้าไปยัง LINE OA สำเร็จ!");
//     } catch (error) {
//         console.error("🚨 ไม่สามารถส่งเมนูไปยัง LINE OA:", error);
//     }
// };


cron.schedule("0 18 * * *", async () => {
    console.log("🔔 กำลังส่งเมนูสินค้าไปยัง LINE...");
    try {
        await sendProductsToLine();
    } catch (error) {
        console.error("Error sending menu:", error);
    }
    
}, {
    scheduled: true,
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

