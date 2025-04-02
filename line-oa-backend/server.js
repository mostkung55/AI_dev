require('dotenv').config();
const express = require('express');
const db = require('./db')
const line = require('@line/bot-sdk');
const route_product = require("./routes/route_product");
const axios = require("axios");
const app = express();
const cors = require('cors')
const cron = require("node-cron");
const { sendProductsToLine, generateProductMenu } = require("./controllers/manage_Product");
const route_order = require('./routes/route_order');
const route_orderitem = require('./routes/route_orderitems');
const route_ingredientitems = require('./routes/route_ingredientitems');
const route_ingredient = require('./routes/route_ingredient');
const dashboardRoutes = require("./routes/route_dashboard");
const { checkIngredientsAvailability, deductIngredientsFromStock } = require("./controllers/manage_Order");

const path = require("path");
const { exec } = require("child_process");
const FormData = require("form-data");
const fs = require("fs");

const EventEmitter = require('events');
EventEmitter.defaultMaxListeners = 20; // เพิ่ม Limit ของ EventEmitter


const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
//Swagger Definition
const swaggerOptions = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "API doc",
            version: "1.0.0",
            description: "A simple API doc",
        },
        servers: [
            {
                url: "http://localhost:3000",
            },
        ],
    },
    apis: ["./routes/*.js"], 
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use('/api/products', route_product);
app.use("/uploads", express.static("uploads"));
app.use("/api/orders", route_order);
app.use("/api/order_items", route_orderitem);
app.use("/api/ingredient", route_ingredient);
app.use("/api/ingredientItems", route_ingredientitems);
app.use('/api/dashboard', dashboardRoutes);


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

const userState = new Map(); // ใช้เก็บสถานะลูกค้า
app.post("/webhook", async (req, res) => {
    const events = req.body.events;

    for (let event of events) {
        if (event.type === "message" && event.message.type === "text") {
            let customerId = event.source.userId;
            let customerText = event.message.text.trim();
            let customerName = "ลูกค้า";

            try {
                    const lowerText = customerText.toLowerCase();
                    if (["เมนู", "menu"].some(word => lowerText.includes(word))) {

                    const flexMessage = await generateProductMenu();
                    if (flexMessage) {
                        return await client.replyMessage(event.replyToken, flexMessage);
                    } else {
                        return await client.replyMessage(event.replyToken, {
                            type: "text",
                            text: "ขออภัย ไม่พบเมนูในขณะนี้ครับ 🍽️"
                        });

                    }
                }
                //  STEP 1: กำลังรอใส่จำนวน
                if (userState.has(customerId) && userState.get(customerId).step === "waiting_quantity") {
                    const { menu } = userState.get(customerId);
                    const quantity = parseInt(customerText);
                    if (isNaN(quantity) || quantity <= 0) {
                        return await client.replyMessage(event.replyToken, {
                            type: "text",
                            text: " กรุณาระบุจำนวนเป็นตัวเลข เช่น 1, 2, 3 ..."
                        });
                    }

                    // ส่งเมนู + จำนวน เข้า Python Model
                    const modelPath = path.join(__dirname, ".", "model", "model.py");

                    const fullText = `${menu} ${quantity}`;
                    exec(`python "${modelPath}" "${fullText}"`, async (error, stdout) => {

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
                            return await client.replyMessage(event.replyToken, {
                                type: "text",
                                text: "❌ ไม่พบสินค้าที่ตรงกับคำสั่งของคุณ กรุณาตรวจสอบชื่อเมนูหรือพิมพ์ว่า 'เมนู' เพื่อดูรายการครับ"
                            });
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

                        //  สร้าง Flex Message ให้ลูกค้ายืนยัน
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

                        await client.replyMessage(event.replyToken, confirmMessage);
                        userState.delete(customerId);
                    });

                    return;
                }

                //  STEP 2: ตรวจสอบว่าข้อความเป็นชื่อเมนูที่มีอยู่หรือไม่
                const [product] = await db.query("SELECT * FROM Product WHERE Product_Name = ?", [customerText]);
                if (product.length > 0) {
                    userState.set(customerId, { step: "waiting_quantity", menu: customerText });
                    return await client.replyMessage(event.replyToken, {
                        type: "text",
                        text: `🍞 คุณเลือก: ${customerText}\nกรุณาระบุจำนวนที่ต้องการ (เช่น: 2)`
                    });
                }

                //  STEP 3: เช็คว่าเป็นการกรอกที่อยู่
                const [waitingOrder] = await db.query(
                    "SELECT Order_ID FROM `Order` WHERE Customer_ID = ? AND Status = 'Awaiting Address'",
                    [customerId]
                );
                if (waitingOrder.length > 0) {
                    let orderId = waitingOrder[0].Order_ID;
                    await db.query(
                        "UPDATE `Order` SET Customer_Address = ?, Status = 'Preparing' WHERE Order_ID = ?",
                        [customerText, orderId]
                    );

                    return await client.replyMessage(event.replyToken, {
                        type: "text",
                        text: `✅ ที่อยู่ของคุณถูกบันทึกเรียบร้อยแล้ว!\n📍 ที่อยู่: ${customerText}\n🛵 กำลังเตรียมคำสั่งซื้อของคุณ`
                    });
                }

                //  STEP 4: บันทึกลูกค้า (ถ้ายังไม่มี)
                const profile = await getUserProfile(customerId);
                if (profile) customerName = profile.displayName;

                await db.query(
                    `INSERT INTO Customer (Customer_ID, Customer_Name) VALUES (?, ?) 
                     ON DUPLICATE KEY UPDATE Customer_Name = VALUES(Customer_Name)`,
                    [customerId, customerName]
                );
                

                await client.replyMessage(event.replyToken, {
                    type: "text",
                    text: "🙏 สวัสดีครับ ต้องการสั่งเมนูอะไรแจ้งได้เลย หรือพิมพ์ว่า 'เมนู' เพื่อดูรายการครับ"
                });

            } catch (error) {
                console.error("🚨 Error processing text message:", error);
            }
        }

        //  STEP 5: ดักจับรูปภาพ (ส่งสลิป)
        else if (event.type === 'message' && event.message.type === "image") {
            const imageId = event.message.id;
            if (!imageId) return;

            const [latestOrder] = await db.query(
                "SELECT Order_ID FROM `Order` WHERE Customer_ID = ? ORDER BY Order_ID DESC LIMIT 1",
                [event.source.userId]
            );

            if (latestOrder.length === 0) {
                return client.replyMessage(event.replyToken, { type: "text", text: "⛔ ไม่พบคำสั่งซื้อของคุณ" });
            }

            const orderId = latestOrder[0].Order_ID;
            const resultMessage = await verifySlip(imageId, orderId, event.source.userId);

            await client.replyMessage(event.replyToken, { type: "text", text: resultMessage });
        }

        //  STEP 6: postback (ยืนยัน / ยกเลิก / ชำระเงิน)
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
                    const ingredientCheck = await checkIngredientsAvailability(data.orderItems);
                    if (!ingredientCheck.success) {
                        return await client.replyMessage(event.replyToken, {
                            type: "text",
                            text: ingredientCheck.message
                        });
                    }

                    const [orderResult] = await db.query(
                        "INSERT INTO `Order` (Customer_ID, Total_Amount, Customer_Address, Status) VALUES (?, ?, NULL, 'Awaiting Address')",
                        [data.customerId, data.totalAmount]
                    );
                    const orderId = orderResult.insertId;

                    for (let item of data.orderItems) {
                        await db.query(
                            "INSERT INTO Order_Item (Order_ID, Product_ID, Quantity, Subtotal, Status) VALUES (?, ?, ?, ?, 'Preparing')",
                            [orderId, item.product_id, item.quantity, item.subtotal]
                        );
                    }

                    await deductIngredientsFromStock(data.orderItems);

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
                await client.replyMessage(event.replyToken, {
                    type: "text",
                    text: "❌ คำสั่งซื้อของคุณถูกยกเลิกเรียบร้อยแล้ว"
                });
            }
            else if (data.action === "payment") {
                const paymentText = data.method === "cash" ? "💵 เงินสด" : "💳 โอนเงิน";
                const [order] = await db.query("SELECT Total_Amount FROM `Order` WHERE Order_ID = ?", [data.orderId]);
                const amount = order[0].Total_Amount;

                await db.query(
                    "INSERT INTO `Payment` (Order_ID, Amount, Method, Payment_Date, Status) VALUES (?, ?, ?, NOW(), 'Pending') " +
                    "ON DUPLICATE KEY UPDATE Method = VALUES(Method), Status = 'Pending'",
                    [data.orderId, amount, data.method]
                );

                if (data.method === "transfer") {
                    const accountDetails = `🏦 รายละเอียดบัญชีสำหรับโอนเงิน:\n\n` +
                        `ธนาคาร: กสิกรไทย (KBank)\n` +
                        `ชื่อบัญชี: นาย พิสิษฐ์ ศรีโมอ่อน\n` +
                        `เลขที่บัญชี: 142-1-36089-4\n\n` +
                        `💰 ยอดที่ต้องชำระ: ${amount} บาท\n\n` +
                        `📌 กรุณาโอนเงินและส่งสลิปยืนยันการชำระเงิน`;

                    await client.replyMessage(event.replyToken, {
                        type: "text",
                        text: accountDetails
                    });
                } else {
                    await client.replyMessage(event.replyToken, {
                        type: "text",
                        text: `💰 ยอดที่ต้องชำระ: ${amount} บาท\n📌 คุณเลือกชำระเงินด้วย: ${paymentText}`
                    });
                }
            }
        }
    }

    res.sendStatus(200);
});

const downloadImage = async (imageId) => {
    const url = `https://api-data.line.me/v2/bot/message/${imageId}/content`;
    const headers = { Authorization: `Bearer ${config.channelAccessToken}` };

    try {
        console.log("📥 Downloading image from:", url);
        // console.log("📥 Sending request with headers:", headers);
        const response = await axios.get(url, { headers, responseType: "arraybuffer" });


        const tmpDir = path.join(__dirname, "tmp");
        if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true });
        }

        const imagePath = path.join(tmpDir, `slip-${imageId}.jpg`);
        fs.writeFileSync(imagePath, response.data);

        return imagePath;
    } catch (error) {
        console.error("❌ Error downloading image:", error.response ? error.response.data.toString() : error.message);
        return null;
    }
};


// ฟังก์ชันตรวจสอบสลิป
const verifySlip = async (imageId, orderId, customerId) => {
    let expectedAmount = null;

    try {
        const imagePath = await downloadImage(imageId);
        
        if (!imagePath) {
            return "❌ ไม่สามารถดาวน์โหลดรูปภาพได้ กรุณาส่งใหม่";
        }
        const slipPath = `tmp/slip-${imageId}.jpg`;
            await db.query(
                "UPDATE Payment SET Slip = ? WHERE Order_ID = ?",
                [slipPath, orderId]
            );

        // ✅ ดึงยอดเงินจากฐานข้อมูล
        const [order] = await db.query(
            "SELECT Total_Amount FROM `Order` WHERE Order_ID = ?",
            [orderId]
        );

        if (order.length === 0) {
            return "❌ ไม่พบคำสั่งซื้อนี้";
        }

        expectedAmount = order[0]?.Total_Amount || null;
        const formattedExpectedAmount = expectedAmount !== null ? Number(expectedAmount).toFixed(2) : "ไม่ระบุ";

        if (!expectedAmount) {
            return "❌ ไม่สามารถดึงยอดที่ต้องชำระได้ กรุณาลองใหม่";
        }

        // ✅ ส่งยอดเงินไปใน request ของ SlipOK
        const formData = new FormData();
        formData.append("files", fs.createReadStream(imagePath));
        formData.append("log", "true");
        formData.append("amount", expectedAmount);

        const SLIPOK_BRANCH_ID = process.env.SLIPOK_BRANCH_ID;
        const SLIPOK_API_KEY = process.env.SLIPOK_API_KEY;

        const response = await axios.post(
            `https://api.slipok.com/api/line/apikey/${SLIPOK_BRANCH_ID}`,
            formData,
            {
                headers: {
                    "x-authorization": SLIPOK_API_KEY,
                    ...formData.getHeaders()
                }
            }
        );

        fs.unlinkSync(imagePath);

        // ✅ ตรวจสอบสลิปสำเร็จ
        if (response.data.success) {
            const slipAmount = response.data.data.amount;

            if (Number(slipAmount) === Number(expectedAmount)) {
                await db.query(
                    "UPDATE Payment SET Status = 'Confirmed' WHERE Order_ID = ?",
                    [orderId]
                );


                return `✅ สลิปถูกต้องและยอดเงินตรงกัน\n💰 ยอดที่ต้องชำระ: ${formattedExpectedAmount} บาท\n💵 ยอดที่โอน: ${slipAmount.toFixed(2)} บาท`;
            } else {
                return `❌ ยอดที่โอน (${slipAmount.toFixed(2)} บาท) ไม่ตรงกับยอดที่ต้องชำระ (${formattedExpectedAmount} บาท)\nกรุณาตรวจสอบและลองใหม่อีกครั้ง`;
            }
        } else {
            const errorCode = response.data.code;
            let errorMessage = response.data.message || "มีข้อผิดพลาดในการตรวจสอบสลิป";
            const slipAmount = response.data.data?.amount || "ไม่ระบุ";

            // ✅ กำหนดข้อความสำรองถ้า message ว่าง
            if (!errorMessage || errorMessage.trim() === "") {
                console.error("❌ Message cannot be empty");
                errorMessage = "มีข้อผิดพลาดในการตรวจสอบสลิป กรุณาลองใหม่อีกครั้ง";
            }


            if (errorCode === 1013) {
                return `❌ ยอดที่โอน (${slipAmount} บาท) ไม่ตรงกับยอดที่ต้องชำระ (${formattedExpectedAmount} บาท)\nกรุณาตรวจสอบและลองใหม่อีกครั้ง`;
            } else {
                return `❌ ${errorMessage}`;
            }
        }
    } catch (error) {
        if (error.response) {
            let errorMessage = error.response.data.message || "มีข้อผิดพลาดในการตรวจสอบสลิป";

            // ✅ กำหนดข้อความสำรองถ้า message ว่าง
            if (!errorMessage || errorMessage.trim() === "") {
                console.error("❌ Message cannot be empty");
                errorMessage = "มีข้อผิดพลาดในการตรวจสอบสลิป กรุณาลองใหม่อีกครั้ง";
            }

            return `❌ ${errorMessage}`;
        } else {
            console.error("❌ Error verifying slip:", error.message);
            return `❌ มีข้อผิดพลาดในการตรวจสอบสลิป`;
        }
    }
};














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



