import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, Select, MenuItem } from "@mui/material";
import axios from "axios";
import "./Order_item.css"; 

const OrderItem = () => {
  const [orderItems, setOrderItems] = useState([]);
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("order_id");

  useEffect(() => {
    loadData();
  }, [orderId]);

  const loadData = async () => {
    try {
      console.log(`Fetching order items for Order ID: ${orderId}`);
      const res = await axios.get(`http://localhost:3000/api/order_items/${orderId}`);
      console.log("API Response:", res.data);
      setOrderItems(res.data);
    } catch (err) {
      console.error("🚨 Error fetching order items:", err);
    }
  };

  const handleStatusChange = async (orderItemId, newStatus) => {
    console.log(`🔄 กำลังเปลี่ยนสถานะของ Order_ItemID ${orderItemId} เป็น ${newStatus}`);
    try {
      const res = await axios.put(`http://localhost:3000/api/order_items/${orderItemId}/status`, { status: newStatus });
      console.log("✅ API Response:", res.data);

      setOrderItems((prevItems) =>
        prevItems.map((item) =>
          item.Order_ItemID === orderItemId ? { ...item, Status: newStatus } : item
        )
      );
    } catch (error) {
      console.error("🚨 Error updating item status:", error.response ? error.response.data : error);
    }
};


  return (
    <div className="order-container"> 
      <Typography variant="h4" align="center" gutterBottom>
        🛒 Order Items
      </Typography>
      <TableContainer component={Paper} className="order-table">
        <Table>
          <TableHead>
            <TableRow style={{ background: "#c5e1a5" }}>
              <TableCell>Item</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Subtotal</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orderItems.length > 0 ? (
              orderItems.map((item) => (
                <TableRow key={item.Order_ItemID} style={{ background: "#f8f5e3" }}>
                  <TableCell>
                    <Typography variant="subtitle1" fontWeight="bold">{item.Product_name}</Typography>
                  </TableCell>
                  <TableCell>{item.Price} บาท</TableCell>
                  <TableCell>{item.Quantity}</TableCell>
                  <TableCell>{item.Subtotal} บาท</TableCell>
                  <TableCell>
                    <Select
                      value={item.Status}
                      onChange={(e) => handleStatusChange(item.Order_ItemID, e.target.value)}
                      size="small"
                    >
                      <MenuItem value="Preparing">Preparing</MenuItem>
                      <MenuItem value="Delivering">Delivering</MenuItem>
                      <MenuItem value="Completed">Completed</MenuItem>
                      <MenuItem value="Paid">Paid</MenuItem>
                    </Select>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center">ไม่มีสินค้าในคำสั่งซื้อนี้</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default OrderItem;
