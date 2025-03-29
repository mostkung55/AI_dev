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
import { useNavigate } from "react-router-dom";
import ListAltIcon from "@mui/icons-material/ListAlt"; 


const ManageIngre = () => {
  const [ingredients, setIngredients] = useState([]);
  const [ingreName, setIngreName] = useState("");
  const [ingreUnit, setIngreUnit] = useState("");
  const [open, setOpen] = useState(false);
  const [lowStockThreshold, setLowStockThreshold] = useState("");
  const [expDate, setExpDate] = useState(""); 
  const navigate = useNavigate();
  const [price, setPrice] = useState("");


  useEffect(() => {
    loadIngredients();
  }, []);

  const loadIngredients = async () => {
    try {
        const res = await axios.get("http://localhost:3000/api/ingredient");

        //  ตรวจสอบและกำหนดค่า isLowStock ใหม่
        const updatedIngredients = res.data.map(ingre => ({
            ...ingre,
            isLowStock: Number(ingre.Quantity) < Number(ingre.Low_stock_threshold), //  คำนวณใหม่ทุกครั้ง
        }));
        setIngredients(updatedIngredients);
    } catch (error) {
        console.error("โหลดวัตถุดิบไม่สำเร็จ", error);
    }
};


const handleAddIngredient = async () => {
  if (!ingreName || !ingreUnit || !expDate) {  
      alert("กรุณากรอกข้อมูลให้ครบ");
      return;
  }

  try {
      await axios.post("http://localhost:3000/api/ingredient", {
          Ingredient_Name: ingreName,  
          Quantity: parseInt(ingreUnit, 10),
          Low_stock_threshold: parseInt(lowStockThreshold, 10) || 5, 
          EXP_date: expDate, //  ส่งค่า EXP_date ไปยัง Backend
          Price: parseFloat(price), //  ส่งข้อมูล Price ไป Backend
      });

      setIngreName("");
      setIngreUnit("");
      setExpDate("");  //  รีเซ็ตค่า EXP_date หลังจากเพิ่มข้อมูล
      setOpen(false);
      loadIngredients();
  } catch (error) {
      console.error("เพิ่มวัตถุดิบไม่สำเร็จ", error);
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
                  <IconButton 
                      color="primary" 
                      onClick={() => navigate(`/ingredient_item?ingredient_id=${ingre.Ingredient_ID}&ingredient_name=${encodeURIComponent(ingre.Ingredient_Name)}`)}
                  >
                      <ListAltIcon />  
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
          <TextField
            label="Expiration Date"
            type="date"
            value={expDate}
            onChange={(e) => setExpDate(e.target.value)}
            fullWidth
            margin="normal"
            size="small"
            InputLabelProps={{
                shrink: true,
            }}
        />
        <TextField
            label="Price"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            fullWidth
            margin="normal"
            size="small"
        />
          
          <Button variant="contained" color="primary" onClick={handleAddIngredient} fullWidth>
            ADD INGREDIENT
          </Button>
        </Box>
      </Modal>

     
    </div>
  );
};

export default ManageIngre;
