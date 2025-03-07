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
const route_order = require('./routes/route_order');
const route_orderitem = require('./routes/route_orderitems');
const route_ingredientitems = require('./routes/route_ingredientitems');
const route_ingredient = require('./routes/route_ingredient');
const { checkIngredientsAvailability, deductIngredientsFromStock } = require("./controllers/manage_Order");

const path = require("path");
const { exec } = require("child_process");

const EventEmitter = require('events');
EventEmitter.defaultMaxListeners = 20; // เพิ่ม Limit ของ EventEmitter




app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use('/api/products', route_product);
app.use("/uploads", express.static("uploads"));
app.use("/api/orders", route_order);
app.use("/api/order_items",route_orderitem);
app.use("/api/ingredient",route_ingredient);
app.use("/api/ingredientItems",route_ingredientitems);


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

            try {
                // ✅ ตรวจสอบว่าลูกค้ากำลังพิมพ์ที่อยู่หรือไม่
                const [waitingOrder] = await db.query(
                    "SELECT Order_ID FROM `Order` WHERE Customer_ID = ? AND Status = 'Awaiting Address'",
                    [customerId]
                );

                if (waitingOrder.length > 0) {
                    let orderId = waitingOrder[0].Order_ID;

                    // ✅ บันทึกที่อยู่ลงใน Order
                    await db.query(
                        "UPDATE `Order` SET Customer_Address = ?, Status = 'Preparing' WHERE Order_ID = ?",
                        [customerText, orderId]
                    );

                    // ✅ แจ้งลูกค้าว่าที่อยู่ถูกบันทึกแล้ว
                    await client.replyMessage(event.replyToken, {
                        type: "text",
                        text: `✅ ที่อยู่ของคุณถูกบันทึกเรียบร้อยแล้ว!\n📍 ที่อยู่: ${customerText}\n🛵 กำลังเตรียมคำสั่งซื้อของคุณ`
                    });

                    return;
                }

                // ✅ ดึงข้อมูลโปรไฟล์ลูกค้า
                const profile = await getUserProfile(customerId);
                if (profile) {
                    customerName = profile.displayName;
                }

                // ✅ บันทึกลูกค้า (ถ้ายังไม่มี)
                await db.query(
                    `INSERT INTO Customer (Customer_ID, Customer_Name) VALUES (?, ?) 
                     ON DUPLICATE KEY UPDATE Customer_Name = VALUES(Customer_Name)`,
                    [customerId, customerName]
                );

                // ✅ เรียกโมเดล Python
                const modelPath = path.join(__dirname, "..", "model", "model.py");
                exec(`python "${modelPath}" "${customerText}"`, async (error, stdout) => {
                    if (error) {
                        console.error("❌ Error running model:", error);
                        return;
                    }

                    let orders;
                    try {
                        orders = JSON.parse(stdout);
                    } catch (parseError) {
                        console.error("❌ JSON Parse Error:", parseError);
                        await client.replyMessage(event.replyToken, { type: "text", text: "เกิดข้อผิดพลาด กรุณาลองใหม่" });
                        return;
                    }

                    if (!Array.isArray(orders) || orders.length === 0) {
                        await client.replyMessage(event.replyToken, { type: "text", text: "❌ ไม่พบสินค้าที่ตรงกับคำสั่งของคุณ" });
                        return;
                    }

                    let totalAmount = 0;
                    let orderItems = [];

                    for (let order of orders) {
                        const [rows] = await db.query(
                            "SELECT Price FROM Product WHERE Product_ID = ?",
                            [order.Product_ID]
                        );
                        if (!rows.length) continue;

                        let price = parseFloat(rows[0].Price);
                        let subtotal = price * order.quantity;
                        totalAmount += subtotal;

                        orderItems.push({
                            product_id: order.Product_ID,
                            menu: order.menu,
                            quantity: order.quantity,
                            subtotal: subtotal
                        });
                    }

                    // ✅ สร้าง Flex Message ให้ลูกค้ายืนยัน (แต่ยังไม่บันทึกลง Database)
                    const confirmMessage = {
                        type: "flex",
                        altText: "กรุณายืนยันคำสั่งซื้อ",
                        contents: {
                            type: "bubble",
                            body: {
                                type: "box",
                                layout: "vertical",
                                contents: [
                                    { type: "text", text: "ยืนยันคำสั่งซื้อ", weight: "bold", size: "xl" },
                                    ...orderItems.map(order => ({
                                        type: "text",
                                        text: `- ${order.menu} x ${order.quantity} ชิ้น (${order.subtotal} บาท)`,
                                        wrap: true
                                    })),
                                    { type: "text", text: `💰 ยอดรวม: ${totalAmount} บาท`, weight: "bold", margin: "md" }
                                ]
                            },
                            footer: {
                                type: "box",
                                layout: "horizontal",
                                spacing: "sm",
                                contents: [
                                    {
                                        type: "button",
                                        style: "primary",
                                        color: "#1DB446",
                                        action: {
                                            type: "postback",
                                            label: "Confirm",
                                            data: JSON.stringify({ action: "confirm_order", customerId, orderItems, totalAmount })
                                        }
                                    },
                                    {
                                        type: "button",
                                        style: "secondary",
                                        color: "#AAAAAA",
                                        action: {
                                            type: "postback",
                                            label: "Cancel",
                                            data: JSON.stringify({ action: "cancel_order", customerId })
                                        }
                                    }
                                ]
                            }
                        }
                    };

                    // ✅ ส่ง Flex Message ให้ลูกค้ากดยืนยัน
                    await client.replyMessage(event.replyToken, confirmMessage);
                });

            } catch (error) {
                console.error("🚨 Error processing order:", error);
            }
        } 
        
        // ✅ ตรวจจับเมื่อมีการกดปุ่ม Confirm หรือ Cancel
        else if (event.type === "postback") {
            let data;
            try {
                data = JSON.parse(event.postback.data);
            } catch (error) {
                console.error("❌ JSON Parse Error in postback:", error);
                return;
            }
        
        
            if (data.action === "confirm_order") {
                try {
                    // ✅ ตรวจสอบวัตถุดิบก่อน
                    const ingredientCheck = await checkIngredientsAvailability(data.orderItems);
                    if (!ingredientCheck.success) {
                        await client.replyMessage(event.replyToken, {
                            type: "text",
                            text: ingredientCheck.message
                        });
                        return;
                    }
            
                    // ✅ บันทึก Order ลงฐานข้อมูล
                    const [orderResult] = await db.query(
                        "INSERT INTO `Order` (Customer_ID, Total_Amount, Customer_Address, Status) VALUES (?, ?, NULL, 'Awaiting Address')",
                        [data.customerId, data.totalAmount]
                    );
                    const orderId = orderResult.insertId;
            
                    // ✅ บันทึก Order Items
                    for (let item of data.orderItems) {
                        await db.query(
                            "INSERT INTO Order_Item (Order_ID, Product_ID, Quantity, Subtotal, Status) VALUES (?, ?, ?, ?, 'Preparing')",
                            [orderId, item.product_id, item.quantity, item.subtotal]
                        );
                    }
            
                    // ✅ หักสต็อกวัตถุดิบ
                    await deductIngredientsFromStock(data.orderItems);
            
                    // ✅ แจ้งลูกค้าให้ส่งที่อยู่
                    await client.replyMessage(event.replyToken, {
                        type: "text",
                        text: "✅ คำสั่งซื้อของคุณได้รับการยืนยันแล้ว!\n📍 กรุณาส่งที่อยู่สำหรับจัดส่งสินค้าของคุณ"
                    });
            
                } catch (error) {
                    console.error("❌ Error saving order:", error);
                    await client.replyMessage(event.replyToken, { type: "text", text: "เกิดข้อผิดพลาด กรุณาลองใหม่" });
                }
            }
            else if (data.action === "cancel_order") {
                // ✅ ส่งข้อความใหม่แทนปุ่ม
                await client.replyMessage(event.replyToken, {
                    type: "text",
                    text: "❌ คำสั่งซื้อของคุณถูกยกเลิกเรียบร้อยแล้ว"
                });
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


cron.schedule("0 12 * * *", async () => {
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



