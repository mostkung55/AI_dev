import React from "react";
import { Box, Typography, Grid, Paper } from "@mui/material";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

// ✅ ข้อมูลจำลองสำหรับกราฟ
const dailySales = [...Array(30)].map((_, i) => ({
  day: `Day ${i + 1}`,
  sales: Math.floor(Math.random() * 500000),
}));

const weeklySales = [...Array(7)].map((_, i) => ({
  week: `Week ${i + 1}`,
  sales: Math.floor(Math.random() * 500000),
}));

const monthlySales = [...Array(12)].map((_, i) => ({
  month: new Date(0, i).toLocaleString("default", { month: "short" }),
  sales: Math.floor(Math.random() * 500000),
}));

const Dashboard = () => {
  return (
    <Box sx={{ padding: 3, backgroundColor: "#f4f6f8", minHeight: "100vh" }}>
      {/* 🔹 Header */}
      <Typography variant="h4" fontWeight="bold" align="center" sx={{ marginBottom: 3 }}>
        📊 Dashboard
      </Typography>

      {/* 🔹 Section: Sales Summary */}
      <Grid container spacing={3} justifyContent="center">
        {[
          { title: "ยอดขาย", value: "XXX,XXX" },
          { title: "ยอดขายสุทธิ", value: "XXX,XXX" },
          { title: "จำนวนออเดอร์", value: "XX" },
        ].map((item, index) => (
          <Grid item xs={12} sm={4} key={index}>
            <Paper sx={{ padding: 3, textAlign: "center", borderRadius: 2, boxShadow: 2 }}>
              <Typography variant="h6" color="textSecondary">{item.title}</Typography>
              <Typography variant="h5" fontWeight="bold">{item.value}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* 🔹 Section: Charts */}
      <Grid container spacing={3} sx={{ marginTop: 4 }}>
        {/* 🔸 ยอดขายต่อวัน */}
        <Grid item xs={12}>
          <Typography variant="h6" fontWeight="bold">ยอดขายต่อวัน</Typography>
          <Paper sx={{ padding: 2, borderRadius: 2, boxShadow: 2 }}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailySales}>
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
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
                <Tooltip />
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
                <Tooltip />
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