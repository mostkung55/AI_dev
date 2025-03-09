import React, { useState, useEffect } from "react";
import { Box, Typography, Grid, Paper } from "@mui/material";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import dayjs from "dayjs";
import axios from "axios";

// ✅ Mock Data สำหรับการทดสอบ
const mockData = {
  dailySales: Array.from({ length: 30 }, (_, i) => ({
    day: dayjs().add(i, 'day').format("YYYY-MM-DD"), // ✅ รูปแบบ YYYY-MM-DD
    sales: Math.floor(Math.random() * 500) + 100
  })),
  weeklySales: Array.from({ length: 7 }, (_, i) => ({
    week: `Week ${i + 1}`, // ✅ ใช้ Week + หมายเลข
    sales: Math.floor(Math.random() * 3000) + 1000
  })),
  monthlySales: Array.from({ length: 12 }, (_, i) => ({
    month: dayjs().month(i).format('MMMM'), // ✅ ใช้ชื่อเดือนเต็ม (Jan, Feb, ... )
    sales: Math.floor(Math.random() * 15000) + 5000
  }))
};

const Dashboard = () => {
  const [summary, setSummary] = useState({
    totalSales: 0,
    orderCount: 0,
    totalCost: 0,
    profit: 0,
  });

  const [dailySales, setDailySales] = useState([]);
  const [weeklySales, setWeeklySales] = useState([]);
  const [monthlySales, setMonthlySales] = useState([]);

  
  useEffect(() => {
    
    loadSummaryData();
    loadSalesData();

    console.log("🚀 Loading mock data...");
    setSummary({ totalSales: 25000, orderCount: 100 });
    setDailySales(mockData.dailySales);
    setWeeklySales(mockData.weeklySales);
    setMonthlySales(mockData.monthlySales);
  }, []);

  
  const loadSummaryData = async () => {
    try {
      const res = await axios.get("http://localhost:3000/api/orders/sales-summary");
      setSummary(res.data || { totalSales: 0, orderCount: 0 });
    } catch (error) {
      console.error("🚨 Error loading sales summary:", error);
      setSummary({ totalSales: 25000, orderCount: 100 });
    }
  };

  const loadSalesData = async () => {
    try {
      const res = await axios.get("http://localhost:3000/api/orders/sales-data");
  
      // ✅ อัปเดตข้อมูลสรุป รวมถึงต้นทุน และกำไร
      setSummary(prev => ({
        ...prev,
        totalCost: res.data.totalCost || 0, // ✅ ถ้าไม่มีข้อมูลให้เป็น 0
        profit: res.data.profit || 0
      }));
  
      // ✅ อัปเดตข้อมูลกราฟ
      setDailySales(res.data.dailySales || mockData.dailySales);
      setWeeklySales(res.data.weeklySales || mockData.weeklySales);
      setMonthlySales(res.data.monthlySales || mockData.monthlySales);
    } catch (error) {
      console.error("🚨 Error loading sales data:", error);
  
      // ✅ ใช้ Mock Data ถ้าดึงข้อมูลล้มเหลว
      setDailySales(mockData.dailySales);
      setWeeklySales(mockData.weeklySales);
      setMonthlySales(mockData.monthlySales);
    }
  };
  
  

  return (
    <Box sx={{ padding: 3, backgroundColor: "#f4f6f8", minHeight: "100vh" }}>
      {/* 🔹 Header */}
      <Typography variant="h4" fontWeight="bold" align="center" sx={{ marginBottom: 3 }}>
        📊 Dashboard
      </Typography>

      {/* 🔹 Section: Sales Summary */}
      <Grid container spacing={3} justifyContent="center">
        <Grid item xs={12} sm={4}>
          <Paper sx={{ padding: 3, textAlign: "center", borderRadius: 2, boxShadow: 2 }}>
            <Typography variant="h6" color="textSecondary">ยอดขายรวม</Typography>
            <Typography variant="h5" fontWeight="bold">
              {summary.totalSales.toLocaleString()} บาท
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ padding: 3, textAlign: "center", borderRadius: 2, boxShadow: 2 }}>
            <Typography variant="h6" color="textSecondary">จำนวนออเดอร์</Typography>
            <Typography variant="h5" fontWeight="bold">
              {summary.orderCount.toLocaleString()} รายการ
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={3}>
            <Paper sx={{ padding: 3, textAlign: "center", borderRadius: 2, boxShadow: 2 }}>
              <Typography variant="h6" color="textSecondary">กำไรสุทธิ</Typography>
              <Typography 
                variant="h5" 
                fontWeight="bold" 
                color={(summary.profit ?? 0) >= 0 ? "primary" : "error"}
              >
                {(summary.profit ?? 0).toLocaleString()} บาท
              </Typography>
            </Paper>
        </Grid>
      </Grid>
      

      {/* 🔹 Section: Charts */}
      <Grid container spacing={3} sx={{ marginTop: 4 }}>
        {/* 🔸 ยอดขายต่อวัน */}
        <Grid item xs={12}>
          <Typography variant="h6" fontWeight="bold">ยอดขายต่อวัน</Typography>
          <Paper sx={{ padding: 2, borderRadius: 2, boxShadow: 2 }}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailySales}>
                <XAxis dataKey="day" tickFormatter={(tick) => dayjs(tick).format("DD/MM")} />
                <YAxis />
                <Tooltip formatter={(value) => value.toLocaleString()} />
                <CartesianGrid strokeDasharray="3 3" />
                <Line type="monotone" dataKey="sales" stroke="#00bcd4" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* 🔸 ยอดขายต่อสัปดาห์ */}
        <Grid item xs={12} sm={6}>
          <Typography variant="h6" fontWeight="bold">ยอดขายต่อสัปดาห์</Typography>
          <Paper sx={{ padding: 2, borderRadius: 2, boxShadow: 2 }}>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={weeklySales}>
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip formatter={(value) => value.toLocaleString()} />
                <CartesianGrid strokeDasharray="3 3" />
                <Bar dataKey="sales" fill="#4caf50" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* 🔸 ยอดขายต่อเดือน */}
        <Grid item xs={12} sm={6}>
          <Typography variant="h6" fontWeight="bold">ยอดขายต่อเดือน</Typography>
          <Paper sx={{ padding: 2, borderRadius: 2, boxShadow: 2 }}>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={monthlySales}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => value.toLocaleString()} />
                <CartesianGrid strokeDasharray="3 3" />
                <Line type="monotone" dataKey="sales" stroke="#ff9800" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
