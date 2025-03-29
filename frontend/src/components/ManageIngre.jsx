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
import { Delete, Add, CheckCircle, Cancel } from "@mui/icons-material";
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
  const [slipFile, setSlipFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const [openPopup, setOpenPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState("success");


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


  const handleUploadSlip = async () => {
    if (!slipFile) {
      alert("กรุณาเลือกรูปใบเสร็จ");
      return;
    }

    const formData = new FormData();
    formData.append("image", slipFile);

    try {
      const res = await axios.post("http://localhost:3000/api/ingredient/upload-slip", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Popup แบบ success
      setPopupMessage(" อัปโหลดใบเสร็จสำเร็จ");
      setPopupType("success");
      setOpenPopup(true);
      setTimeout(() => setOpenPopup(false), 3000);

      setSlipFile(null);
      setOpen(false);
      loadIngredients(); // โหลดวัตถุดิบใหม่
    } catch (error) {
      console.error("❌ อัปโหลดใบเสร็จล้มเหลว:", error);

      // Popup แบบ error
      setPopupMessage("❌ อัปโหลดไม่สำเร็จ");
      setPopupType("error");
      setOpenPopup(true);
      setTimeout(() => setOpenPopup(false), 3000);
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
      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          setPreviewUrl(null);     //  เคลียร์ preview
          setSlipFile(null);       //  เคลียร์ไฟล์
        }}
      >
        <Box className="modal-box">
          <Typography variant="h6" gutterBottom>
            Upload Receipt Slip
          </Typography>

          {/* เลือกไฟล์ */}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files[0];
              setSlipFile(file);
              if (file) {
                setPreviewUrl(URL.createObjectURL(file));
              }
            }}
            style={{ marginBottom: "1rem" }}
          />

          {/* รูป Preview */}
          {previewUrl && (
            <img
              src={previewUrl}
              alt="receipt preview"
              style={{
                width: "100%",
                maxHeight: "300px",
                objectFit: "contain",
                marginBottom: "1rem",
                borderRadius: "8px",
                boxShadow: "0 0 6px rgba(0,0,0,0.2)",
              }}
            />
          )}

          {/* ปุ่มอัปโหลด */}
          <Button
            variant="contained"
            color="primary"
            onClick={handleUploadSlip}
            fullWidth
            disabled={!slipFile}
          >
            Upload Slip
          </Button>
        </Box>
      </Modal>
      <Modal open={openPopup} onClose={() => setOpenPopup(false)}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            bgcolor: "white",
            boxShadow: 24,
            p: 4,
            borderRadius: 3,
            textAlign: "center",
          }}
        >
          {popupType === "success" ? (
            <CheckCircle sx={{ fontSize: 60, color: "green" }} />
          ) : (
            <Cancel sx={{ fontSize: 60, color: "red" }} />
          )}

          <Typography variant="h6" sx={{ mt: 2, fontWeight: "bold" }}>
            {popupMessage}
          </Typography>
        </Box>
      </Modal>


    </div>
  );
};

export default ManageIngre;
