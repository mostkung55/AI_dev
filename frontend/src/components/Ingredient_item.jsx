import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import axios from "axios";
import moment from "moment-timezone";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";

const IngredientItem = () => {
  const location = useLocation(); //  ใช้เพื่อดึงข้อมูลจาก URL
  const queryParams = new URLSearchParams(location.search);
  const ingredientId = queryParams.get("ingredient_id");
  const ingredientName = queryParams.get("ingredient_name");
  const navigate = useNavigate();

  const [editingIndex, setEditingIndex] = useState(null);
  const [newExpDate, setNewExpDate] = useState("");

  const [ingredientItems, setIngredientItems] = useState([]);
  const formatDateToThaiTime = (dateString) => {
    return moment(dateString).tz("Asia/Bangkok").format("DD/MM/YYYY HH:mm:ss");
  };
  useEffect(() => {
    const loadIngredientItems = async () => {
      try {
        if (!ingredientId) return; // หยุดถ้าไม่มี ingredientId
        console.log("🔎 กำลังโหลดข้อมูล Ingredient_Item ของ ID:", ingredientId);

        const res = await axios.get(`http://localhost:3000/api/ingredientItems?ingredient_id=${ingredientId}`);
        setIngredientItems(res.data);
      } catch (error) {
        console.error("🚨 โหลดข้อมูล Ingredient_Item ไม่สำเร็จ", error);
      }
    };
    loadIngredientItems();
  }, [ingredientId]);

  const handleSaveExpDate = async (batchCode) => {
    try {
      await axios.put("http://localhost:3000/api/ingredientItems/update-exp", {
        batch_code: batchCode,
        exp_date: newExpDate,
      });
      setEditingIndex(null);
      setNewExpDate("");
      // โหลดข้อมูลใหม่
      const res = await axios.get(`http://localhost:3000/api/ingredientItems?ingredient_id=${ingredientId}`);
      setIngredientItems(res.data);
    } catch (err) {
      console.error("❌ อัปเดตวันหมดอายุล้มเหลว", err);
    }
  };

  //  ฟังก์ชันแปลงรูปแบบวันที่ให้ดูง่ายขึ้น
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }) + ` (${date.toLocaleTimeString("en-GB")})`; //  แสดงวันที่ + เวลาล่าสุด
  };

  return (
    <div className="ingredient-container">
      <div className="back-button-container">
        <IconButton
          variant="outlined"
          color="secondary"
          onClick={() => navigate('/Ingre')}
          sx={{ marginBottom: 2 }}
        >
          ⬅️
        </IconButton>
      </div>



      <Typography variant="h5" align="center" gutterBottom>
        Ingredient Items - {ingredientName || "Unknown"}
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow style={{ background: "#c5e1a5" }}>
              <TableCell>No.</TableCell>
              <TableCell>Batch Code</TableCell>
              <TableCell align="center">Quantity</TableCell>
              <TableCell align="center">Price</TableCell>
              <TableCell align="center">Expiration Date</TableCell>
              <TableCell align="center">Last Updated</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {ingredientItems.map((item, index) => (
              <TableRow key={item.Batch_code} style={{ background: "#f8f5e3" }}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{item.Batch_code ?? "N/A"}</TableCell>
                <TableCell align="center">{item.Quantity ?? 0}</TableCell>
                <TableCell align="center">{item.Price?.toFixed(2) ?? "N/A"}</TableCell>

                {/* ✅ Editable EXP date */}
                <TableCell align="center">
                  {editingIndex === index ? (
                    <>
                      <input
                        type="date"
                        value={newExpDate}
                        onChange={(e) => setNewExpDate(e.target.value)}
                        style={{ marginRight: 8 }}
                      />
                      <IconButton onClick={() => handleSaveExpDate(item.Batch_code)} size="small">
                        <SaveIcon fontSize="small" />
                      </IconButton>
                    </>
                  ) : (
                    <>
                      {new Date(item.EXP_date).toLocaleDateString("th-TH")}
                      <IconButton
                        onClick={() => {
                          setEditingIndex(index);
                          setNewExpDate(new Date(item.EXP_date).toISOString().split("T")[0]);
                        }}
                        size="small"
                        sx={{ ml: 1 }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </>
                  )}
                </TableCell>
                <TableCell align="center">
                  {new Date(item.Updated_at).toLocaleString("th-TH")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>

        </Table>
      </TableContainer>
    </div>
  );
};

export default IngredientItem;
