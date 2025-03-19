import React, { useState, useEffect } from "react";
import {
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Select,
  MenuItem,
  Switch, // ✅ เพิ่ม Switch
  FormControlLabel // ✅ เพิ่ม FormControlLabel
} from "@mui/material";
import { Delete, ListAlt as ListAltIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom"; 
import axios from "axios";
import "./ManageOrder.css";

const ManageOrder = () => {
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate(); 
  const [paidOrders, setPaidOrders] = useState([]);
  const [showPaidOnly, setShowPaidOnly] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
        const res = await axios.get("http://localhost:3000/api/orders");

        // ✅ แยกคำสั่งซื้อที่เป็น "Paid" ออกจากรายการหลัก
        const paid = res.data.filter(order => order.Status?.trim().toLowerCase() === "paid");
        const notPaid = res.data.filter(order => order.Status?.trim().toLowerCase() !== "paid");

        setPaidOrders(paid);  // เก็บคำสั่งที่เป็น paid ไว้ใน state ใหม่
        setOrders(notPaid);   // เก็บคำสั่งอื่น ๆ ไว้ใน state หลัก
    } catch (err) {
        console.error("🚨 Error fetching orders:", err);
    }
};



  const handleDelete = async (Order_ID) => {
    if (!window.confirm("คุณแน่ใจหรือไม่ที่จะลบคำสั่งซื้อนี้?")) return;
    try {
      await axios.delete(`http://localhost:3000/api/orders/${Order_ID}`);
      setOrders((prevOrders) => prevOrders.filter((order) => order.Order_ID !== Order_ID));
    } catch (error) {
      console.error("🚨 Error deleting order:", error);
    }
  };

  return (
    <div className="container">
      <Typography variant="h4" align="center" gutterBottom>
        📦 Manage Orders
      </Typography>
      <FormControlLabel
          control={
            <Switch
              checked={showPaidOnly}
              onChange={() => setShowPaidOnly(!showPaidOnly)}
              color="primary"
            />
          }
          label="Order History"
        />
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow style={{ background: "#c5e1a5" }}>
              <TableCell>Order ID</TableCell>
              <TableCell>Customer ID</TableCell>
              <TableCell>Address</TableCell>
              <TableCell>Created At</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Total Amount</TableCell>
              <TableCell>Manage</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
          {(showPaidOnly ? paidOrders : orders).map((order) => (
              <TableRow key={order.Order_ID} style={{ background: "#f8f5e3" }}>
                  <TableCell>{order.Order_ID}.</TableCell>
                  <TableCell>{order.Customer_ID}</TableCell>
                  <TableCell>{order.Customer_Address}</TableCell>
                  <TableCell>
                      {new Date(order.Created_at).toLocaleString("th-TH")}
                  </TableCell>
                  <TableCell>{order.Status}</TableCell>
                  <TableCell>{order.Total_Amount} บาท</TableCell>
                  <TableCell>
                      <IconButton
                          color="primary"
                          onClick={() => navigate(`/order_item?order_id=${order.Order_ID}`)}
                      >
                          <ListAltIcon />
                      </IconButton>
                      <IconButton
                          color="error"
                          onClick={() => handleDelete(order.Order_ID)}
                      >
                          <Delete />
                      </IconButton>
                  </TableCell>
              </TableRow>
          ))}

          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default ManageOrder;
