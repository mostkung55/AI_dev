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

  useEffect(() => {
    loadIngredients();
  }, []);

  const loadIngredients = async () => {
    try {
      const res = await axios.get("http://localhost:3000/api/ingredients");
      setIngredients(res.data);
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
      await axios.post("http://localhost:3000/api/ingredients", {
        name: ingreName,
        unit: ingreUnit,
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
      await axios.put(`http://localhost:3000/api/ingredients/${editId}`, {
        name: ingreName,
        unit: ingreUnit,
      });

      setIngreName("");
      setIngreUnit("");
      setEditId(null);
      setOpenEdit(false);
      loadIngredients();
    } catch (error) {
      console.error("แก้ไขวัตถุดิบไม่สำเร็จ", error);
    }
  };

  const handleDeleteIngredient = async (id) => {
    if (!window.confirm("คุณแน่ใจหรือไม่ที่จะลบวัตถุดิบนี้?")) return;

    try {
      await axios.delete(`http://localhost:3000/api/ingredients/${id}`);
      loadIngredients();
    } catch (error) {
      console.error("ลบวัตถุดิบไม่สำเร็จ", error);
    }
  };

  const handleEdit = (ingredient) => {
    setIngreName(ingredient.name);
    setIngreUnit(ingredient.unit);
    setEditId(ingredient.id);
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
              <TableCell>Ingredient Name</TableCell>
              <TableCell>Unit</TableCell>
              <TableCell>Manage</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {ingredients.map((ingre, index) => (
              <TableRow key={ingre.id} style={{ background: "#f8f5e3" }}>
                <TableCell>{index + 1}.</TableCell>
                <TableCell>{ingre.name}</TableCell>
                <TableCell>{ingre.unit}</TableCell>
                <TableCell>
                  <IconButton color="warning" onClick={() => handleEdit(ingre)}>
                    <Edit />
                  </IconButton>
                  <IconButton color="error" onClick={() => handleDeleteIngredient(ingre.id)}>
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
            label="Unit"
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
            label="Ingredient Name"
            value={ingreName}
            onChange={(e) => setIngreName(e.target.value)}
            fullWidth
            margin="normal"
            size="small"
          />
          <TextField
            label="Unit"
            value={ingreUnit}
            onChange={(e) => setIngreUnit(e.target.value)}
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
