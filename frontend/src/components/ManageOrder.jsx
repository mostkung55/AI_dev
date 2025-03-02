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
} from "@mui/material";
import { Delete, ListAlt as ListAltIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom"; 
import axios from "axios";
import "./ManageOrder.css";

const ManageOrder = () => {
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate(); 

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await axios.get("http://localhost:3000/api/orders");
      setOrders(res.data);
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
            {orders.map((order) => (
              <TableRow key={order.Order_ID} style={{ background: "#f8f5e3" }}>
                <TableCell>{order.Order_ID}.</TableCell>
                <TableCell>{order.Customer_ID}</TableCell>
                <TableCell>{order.Customer_Address}</TableCell>
                <TableCell>{new Date(order.Created_at).toLocaleString()}</TableCell>
                <TableCell>{order.Status}</TableCell>
                <TableCell>{order.Total_Amount} บาท</TableCell>
                <TableCell>
                 
                  <IconButton 
                    color="primary" 
                    onClick={() => navigate(`/order_item?order_id=${order.Order_ID}`)}
                  >
                   <ListAltIcon />  
                  </IconButton>
                  {/* 🗑️ ปุ่มลบ */}
                  <IconButton color="error" onClick={() => handleDelete(order.Order_ID)}>
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
