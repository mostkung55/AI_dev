const db = require('../db');

// ✅ ฟังก์ชันคำนวณกำไรสุทธิ
const calculateProfit = async (startDate, endDate) => {
    try {
        // ✅ ถ้าไม่มีวันที่ ให้ใช้วันปัจจุบัน
        const start = startDate ? `${startDate} 00:00:00` : "2000-01-01 00:00:00";
        const end = endDate ? `${endDate} 23:59:59` : "2099-12-31 23:59:59";

        // ✅ ดึงยอดขายรวม
        const [totalSales] = await db.query(`
            SELECT SUM(Total_Amount) AS totalSales 
            FROM \`Order\`
            WHERE Status IN ('paid')
            AND Created_at BETWEEN ? AND ?;
        `, [start, end]);

        // ✅ ดึงต้นทุนรวม 
        const [totalCost] = await db.query(`
            SELECT COALESCE(SUM(ii.Price), 0) AS totalCost
            FROM Ingredient_Item ii
            WHERE ii.Updated_at BETWEEN ? AND ?;
        `, [start, end]);
 
        // ✅ คำนวณกำไร
        const profit = (totalSales[0]?.totalSales || 0) - (totalCost[0]?.totalCost || 0);

        return {
            totalSales: totalSales[0]?.totalSales || 0,
            totalCost: totalCost[0]?.totalCost || 0,
            profit
        };
    } catch (error) {
        console.error("🚨 Error calculating profit:", error);
        throw new Error("Failed to calculate profit.");
    }
};

// ✅ ดึงข้อมูลยอดขายรายวัน รายสัปดาห์ รายเดือน
exports.getSalesData = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        // ✅ ดึงข้อมูลยอดขายรายวัน
        const [dailySales] = await db.query(`
            SELECT DATE(Created_at) AS day,
                   SUM(Total_Amount) AS sales
            FROM \`Order\`
            WHERE Status IN ('paid', 'completed')
            GROUP BY DATE(Created_at)
            ORDER BY DATE(Created_at)
        `);

        // ✅ ดึงข้อมูลยอดขายรายสัปดาห์
        const [weeklySales] = await db.query(`
            SELECT ANY_VALUE(CONCAT(YEAR(Created_at), '-W', WEEK(Created_at))) AS week,
                   SUM(Total_Amount) AS sales
            FROM \`Order\`
            WHERE Status IN ('paid', 'completed')
            GROUP BY YEAR(Created_at), WEEK(Created_at)
            ORDER BY YEAR(Created_at), WEEK(Created_at)
        `);

        // ✅ ดึงข้อมูลยอดขายรายเดือน
        const [monthlySales] = await db.query(`
            SELECT ANY_VALUE(MONTHNAME(Created_at)) AS month,
                   SUM(Total_Amount) AS sales
            FROM \`Order\`
            WHERE Status IN ('paid', 'completed')
            GROUP BY YEAR(Created_at), MONTH(Created_at)
            ORDER BY YEAR(Created_at), MONTH(Created_at)
        `);

        // ✅ เรียกใช้ฟังก์ชันคำนวณกำไร
        const { totalSales, totalCost, profit } = await calculateProfit(startDate, endDate);

        res.status(200).json({
            dailySales,
            weeklySales,
            monthlySales,
            totalCost,
            profit
        });
    } catch (error) {
        console.error("🚨 Error fetching sales data:", error);
        res.status(500).json({ message: "Failed to fetch sales data." });
    }
};

// ✅ ดึงข้อมูลยอดขายรวม
exports.getSalesSummary = async (req, res) => {
    try {
        const [totalSales] = await db.query(`
            SELECT SUM(Total_Amount) AS totalSales 
            FROM \`Order\`
            WHERE Status IN ('completed', 'paid')
        `);

        const [orderCount] = await db.query(`
            SELECT COUNT(*) AS orderCount 
            FROM \`Order\`
            WHERE Status IN ('completed', 'paid')
        `);

        res.status(200).json({
            totalSales: totalSales[0].totalSales || 0,
            orderCount: orderCount[0].orderCount || 0,
        });
    } catch (error) {
        console.error("🚨 Error fetching sales summary:", error);
        res.status(500).json({ message: "Failed to fetch sales summary." });
    }
};
