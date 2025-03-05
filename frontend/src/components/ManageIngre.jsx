import React, { useState, useEffect } from "react";
import {
  Button,
  TextField,
  Typography,
  Modal,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
} from "@mui/material";
import { Delete, Edit, Add } from "@mui/icons-material";
import axios from "axios";

const ManageIngre = () => {
  const [ingredients, setIngredients] = useState([]);
  const [ingreName, setIngreName] = useState("");
  const [ingreUnit, setIngreUnit] = useState("");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [openEdit, setOpenEdit] = useState(false);
  const [lowStockThreshold, setLowStockThreshold] = useState("");


  useEffect(() => {
    loadIngredients();
  }, []);

  const loadIngredients = async () => {
    try {
        const res = await axios.get("http://localhost:3000/api/ingredient");

        // ✅ ตรวจสอบและกำหนดค่า isLowStock ใหม่
        const updatedIngredients = res.data.map(ingre => ({
            ...ingre,
            isLowStock: Number(ingre.Quantity) < Number(ingre.Low_stock_threshold), // ✅ คำนวณใหม่ทุกครั้ง
        }));
        setIngredients(updatedIngredients);
    } catch (error) {
        console.error("โหลดวัตถุดิบไม่สำเร็จ", error);
    }
};


  const handleAddIngredient = async () => {
    if (!ingreName || !ingreUnit) {
      alert("กรุณากรอกข้อมูลให้ครบ");
      return;
    }

    try {
      await axios.post("http://localhost:3000/api/ingredient", {
        Ingredient_Name: ingreName,  
        Quantity: parseInt(ingreUnit, 10),
        Low_stock_threshold: parseInt(lowStockThreshold, 10) || 5, // ✅ กำหนดค่า Default เป็น 5 ถ้าผู้ใช้ไม่ใส่ค่า
    });
    

      setIngreName("");
      setIngreUnit("");
      setOpen(false);
      loadIngredients();
    } catch (error) {
      console.error("เพิ่มวัตถุดิบไม่สำเร็จ", error);
    }
  };

  const handleEditIngredient = async () => {
    if (!ingreName || !ingreUnit) {
        alert("กรุณากรอกข้อมูลให้ครบ");
        return;
    }

    try {
        await axios.put(`http://localhost:3000/api/ingredient/${editId}`, {
            Ingredient_Name: ingreName,  
            Quantity: parseInt(ingreUnit, 10),
            Low_stock_threshold: parseInt(lowStockThreshold, 10),
        });

        setIngreName("");
        setIngreUnit("");
        setLowStockThreshold("");
        setEditId(null);
        setOpenEdit(false);

        loadIngredients(); // ✅ โหลดข้อมูลใหม่ทันทีหลังจากอัปเดต Stock
    } catch (error) {
        console.error("🚨 แก้ไขวัตถุดิบไม่สำเร็จ:", error);
    }
};


  const handleDeleteIngredient = async (id) => {
    if (!window.confirm("คุณแน่ใจหรือไม่ที่จะลบวัตถุดิบนี้?")) return;

    try {
      await axios.delete(`http://localhost:3000/api/ingredient/${id}`);
      loadIngredients();
    } catch (error) {
      console.error("ลบวัตถุดิบไม่สำเร็จ", error);
    }
  };

  const handleEdit = (ingredient) => {
    setIngreName(ingredient.Ingredient_Name);
    setIngreUnit(ingredient.Quantity);
    setEditId(ingredient.Ingredient_ID);
    setLowStockThreshold(ingredient.Low_stock_threshold || 5); // ✅ ถ้าไม่มีค่าให้ใช้ Default = 5
    setOpenEdit(true);
};


  return (
    <div className="container">
      <Typography variant="h5" align="center" gutterBottom>
        Manage Ingredients
      </Typography>

      <TableContainer component={Paper}>
        <Table>
        <TableHead>
            <TableRow style={{ background: "#c5e1a5" }}>
              <TableCell>No.</TableCell>
              <TableCell>Name</TableCell>
              <TableCell align="center">Quantity</TableCell>
              <TableCell align="center">Stock Status</TableCell>
              <TableCell align="center">Manage</TableCell>
            </TableRow>
          </TableHead>


          <TableBody>
              {ingredients.map((ingre, index) => (
                <TableRow 
                  key={ingre.Ingredient_ID} 
                  style={{ background: ingre.isLowStock ? "#ffcccc" : "#f8f5e3" }}
                >
                  <TableCell>{index + 1}.</TableCell>
                  <TableCell>{ingre.Ingredient_Name}</TableCell>
                  <TableCell align="center">{ingre.Quantity}</TableCell>
                  <TableCell>
                        {ingre.isLowStock ? (
                            <Typography color="error">⚠️ Low Stock (ต่ำกว่า {ingre.Low_stock_threshold})</Typography>
                        ) : (
                            <Typography color="green" align="center">✅ Ready to Use</Typography>
                        )}
                    </TableCell>

                  <TableCell align="center">
                    <IconButton color="warning" onClick={() => handleEdit(ingre)}>
                      <Edit />
                    </IconButton>
                    <IconButton color="error" onClick={() => handleDeleteIngredient(ingre.Ingredient_ID)}>
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>

        </Table>
      </TableContainer>

      {/* Floating Button (+) */}
      <IconButton
        color="primary"
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          backgroundColor: "#4caf50",
          color: "white",
          borderRadius: "50%",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.2)",
        }}
        onClick={() => {
          setIngreName("");
          setIngreUnit("");
          setEditId(null);
          setOpen(true);
        }}
      >
        <Add />
      </IconButton>
      <Typography style={{ position: "fixed", bottom: "20px", right: "75px" }}>
        Add Ingredient
      </Typography>

      {/* Modal ฟอร์มเพิ่ม */}
      <Modal open={open} onClose={() => setOpen(false)}>
        <Box className="modal-box">
          <Typography variant="h6" gutterBottom>
            {"Add New Ingredient"}
          </Typography>
          <TextField
            label="Ingredient Name"
            value={ingreName}
            onChange={(e) => setIngreName(e.target.value)}
            fullWidth
            margin="normal"
            size="small"
          />
          <TextField
            label="Quantity"
            value={ingreUnit}
            onChange={(e) => setIngreUnit(e.target.value)}
            fullWidth
            margin="normal"
            size="small"
          />
          
          <Button variant="contained" color="primary" onClick={handleAddIngredient} fullWidth>
            ADD INGREDIENT
          </Button>
        </Box>
      </Modal>

      {/* Modal แก้ไข */}
      <Modal open={openEdit} onClose={() => setOpenEdit(false)}>
        <Box className="modal-box">
          <Typography variant="h6" gutterBottom>
            Edit Ingredient
          </Typography>
          <TextField
            label="Name"
            value={ingreName}
            onChange={(e) => setIngreName(e.target.value)}
            fullWidth
            margin="normal"
            size="small"
          />
          <TextField
            label="Quatity"
            value={ingreUnit}
            onChange={(e) => setIngreUnit(e.target.value)}
            fullWidth
            margin="normal"
            size="small"
          />
          <TextField
                label="Low Stock Threshold"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(e.target.value)}
                fullWidth
                margin="normal"
                size="small"
            />
          <Button variant="contained" color="secondary" onClick={handleEditIngredient} fullWidth>
            SAVE CHANGES
          </Button>
        </Box>
      </Modal>
    </div>
  );
};

export default ManageIngre;
