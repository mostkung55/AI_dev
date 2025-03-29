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
import "./ManageProduct.css";
import axios from "axios";
import { Snackbar, Alert } from "@mui/material";
import { CheckCircle, Cancel } from "@mui/icons-material";


const ManageProduct = () => {
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productRes, ingredientRes] = await Promise.all([
          axios.get("http://localhost:3000/api/products"),
          axios.get("http://localhost:3000/api/ingredient")
        ]);

        setData(productRes.data);  //  ตั้งค่า Product
        setIngredients(ingredientRes.data);  //  ตั้งค่าวัตถุดิบ
      } catch (error) {
        console.error("🚨 โหลดข้อมูลล้มเหลว:", error);
      }
    };

    fetchData();
  }, []);

  const [Product_Name, setProductName] = useState("");
  const [Description, setDescription] = useState("");
  const [Price, setPrice] = useState("");
  const [Product_image, setImage] = useState(null);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [openEdit, setOpenEdit] = useState(false);

  const [openPopup, setOpenPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState("success"); // "success" หรือ "error"

  const [ingredients, setIngredients] = useState([]);
  const [selectedIngredients, setSelectedIngredients] = useState([]);



  const [data, setData] = useState([]);
  const loadData = async () => {
    await axios.get('http://localhost:3000/api/products')
      .then((res) => setData(res.data))
      .catch((err) => console.log(err))
  }

  const handleImageUpload = (event) => {
    const file = event.target.files[0];

    if (file) {
      if (file.size > 50 * 1024 * 1024) { // ตรวจสอบขนาดไฟล์
        alert("ไฟล์ใหญ่เกินไป! กรุณาอัปโหลดไฟล์ที่มีขนาดต่ำกว่า 50MB");
        return;
      }
      setImage(file); // เก็บไฟล์ไว้ใน state
    }
  };
  const showPopup = (message, type = "success") => {
    setPopupMessage(message);
    setPopupType(type);
    setOpenPopup(true);

    setTimeout(() => setOpenPopup(false), 2000); // ปิดอัตโนมัติใน 2 วินาที
  };


  const handleAddProduct = async () => {
    if (!Product_Name || !Price || !Description || !Product_image) {
      showPopup("Please fill in all fields!", "error");
      return;
    }

    const formData = new FormData();
    formData.append("name", Product_Name);
    formData.append("description", Description);
    formData.append("price", Price);
    formData.append("Product_image", Product_image);
    formData.append("ingredients", JSON.stringify(selectedIngredients)); //  ส่ง JSON ของวัตถุดิบ

    try {
      await axios.post("http://localhost:3000/api/products", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      showPopup(" เพิ่มสินค้าสำเร็จ!", "success");
      loadData();
      setSelectedIngredients([]); //  รีเซ็ตวัตถุดิบที่เลือก
      setOpen(false);
    } catch (error) {
      showPopup(" เพิ่มสินค้าไม่สำเร็จ!", "error");
    }
  };

  const handleEditProduct = async () => {
    if (!Product_Name || !Description || !Price) {
      showPopup("Please fill in all fields!", "error");
      return;
    }

    const formData = new FormData();
    formData.append("name", Product_Name);
    formData.append("description", Description);
    formData.append("price", Price);
    formData.append("ingredients", JSON.stringify(selectedIngredients)); //  ส่งข้อมูลวัตถุดิบที่แก้ไข

    if (Product_image instanceof File) {
      formData.append("Product_image", Product_image);
    }

    try {
      await axios.put(`http://localhost:3000/api/products/${editId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      showPopup(" แก้ไข Product สำเร็จ!", "success");
      loadData();
      setOpenEdit(false);
    } catch (error) {
      showPopup(" แก้ไข Product ไม่สำเร็จ!", "error");
    }
  };


  const handleDelete = async (id) => {
    if (!window.confirm("คุณแน่ใจหรือไม่ที่จะลบสินค้านี้?")) return;

    try {
      await axios.delete(`http://localhost:3000/api/products/${id}`);
      setData(data.filter((product) => product.Product_ID !== id));

      showPopup(" ❌ลบสินค้าสำเร็จ!", "success");
    } catch (error) {
      showPopup(" ❌ลบสินค้าไม่สำเร็จ!", "error");
    }
  };

  const handleEdit = async (product) => {
    setProductName(product.Product_Name);
    setDescription(product.Description);
    setPrice(product.Price);
    setImage(product.Product_image);
    setEditId(product.Product_ID);

    //  โหลดรายการวัตถุดิบทั้งหมด (ป้องกันกรณีที่ Add Product โหลดวัตถุดิบ แต่ Edit ไม่โหลด)
    try {
      const res = await axios.get("http://localhost:3000/api/ingredient");
      setIngredients(res.data);
    } catch (error) {
      console.error("🚨 โหลดวัตถุดิบล้มเหลว:", error);
    }

    //  ตรวจสอบว่า Ingredients ของสินค้ามีค่าหรือไม่
    let parsedIngredients = [];
    if (typeof product.Ingredients === "string") {
      try {
        parsedIngredients = JSON.parse(product.Ingredients);
      } catch (error) {
        console.error("🚨 JSON Parse Error:", error);
      }
    } else if (Array.isArray(product.Ingredients)) {
      parsedIngredients = product.Ingredients;
    }

    setSelectedIngredients(parsedIngredients); //  ตั้งค่าวัตถุดิบที่ใช้ของสินค้า
    setOpenEdit(true);
  };


  const handleAddIngredient = (id) => {
    const ingredient = ingredients.find(i => i.Ingredient_ID === id);
    if (ingredient && !selectedIngredients.some(sel => sel.id === id)) {
      setSelectedIngredients([...selectedIngredients, { id, name: ingredient.Ingredient_Name, quantity: 1 }]);
    }
  };
  const handleRemoveIngredient = (index) => {
    const updatedIngredients = [...selectedIngredients];
    updatedIngredients.splice(index, 1);
    setSelectedIngredients(updatedIngredients);
  };

  const handleQuantityChange = (index, quantity) => {
    const updated = [...selectedIngredients];
    updated[index].quantity = quantity;
    setSelectedIngredients(updated);
  };

  const handleSendToLine = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/products/sendToLine");
      console.log("✅ ส่งเมนูไปยัง LINE สำเร็จ!");
      alert("✅ ส่งเมนูสินค้าไปยัง LINE OA สำเร็จ!");
    } catch (error) {
      console.error("❌ ไม่สามารถส่งไปยัง LINE:", error);
      alert("❌ เกิดข้อผิดพลาดในการส่งเมนู");
    }
  };

  return (
    <div className="container">
      <Typography variant="h5" align="center" gutterBottom>
        Manage Product
      </Typography>

      <Button
        variant="contained"
        color="success"
        onClick={handleSendToLine}
        style={{ marginBottom: "10px" }}
      >
        📤 ส่งเมนูไปยัง LINE OA
      </Button>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow style={{ background: "#c5e1a5" }}>
              <TableCell>No.</TableCell>
              <TableCell>Pic.</TableCell>
              <TableCell>Product Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Ingredients</TableCell>
              <TableCell>Manage</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((product, index) => (
              <TableRow key={product.Product_ID} style={{ background: "#f8f5e3" }}>
                <TableCell>{index + 1}.</TableCell>
                <TableCell>
                  {product.Product_image ? (
                    <img
                      src={`http://localhost:3000${product.Product_image}`}
                      alt={product.Product_Name}
                      onError={(e) => e.target.src = "https://via.placeholder.com/50"}
                      style={{ width: "50px", height: "50px", borderRadius: "5px" }}
                    />
                  ) : (
                    <img
                      src="https://via.placeholder.com/50"
                      alt="No Image"
                      style={{ width: "50px", height: "50px", borderRadius: "5px" }}
                    />
                  )}
                </TableCell>
                <TableCell>
                  <Typography fontWeight="bold">{product.Product_Name}</Typography>
                </TableCell>
                <TableCell>{product.Description}</TableCell>
                <TableCell>{product.Price}</TableCell>
                <TableCell>
                  {product.Ingredients.length > 0 ? (
                    product.Ingredients.map((ing, idx) => (
                      <Typography key={idx}>{ing.name} ({ing.quantity})</Typography>
                    ))
                  ) : (
                    <Typography color="gray">ไม่มีวัตถุดิบ</Typography>
                  )}
                </TableCell>
                <TableCell>
                  <IconButton color="warning" onClick={() => handleEdit(product)}>
                    <Edit />
                  </IconButton>
                  <IconButton color="error" onClick={() => handleDelete(product.Product_ID)}>
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
          setProductName("");
          setDescription("");
          setPrice("");
          setImage(null);
          setEditId(null);
          setOpen(true);
        }}
      >
        <Add />
      </IconButton>
      <Typography style={{ position: "fixed", bottom: "20px", right: "75px" }}>
        Add product
      </Typography>

      {/* Modal ฟอร์มเพิ่ม */}
      <Modal open={open} onClose={() => setOpen(false)}>
        <Box className="modal-box">
          <Typography variant="h6" gutterBottom>
            {"Add New Product"}
          </Typography>
          <input type="file" accept="image/*" onChange={handleImageUpload} className="file-input" />

          <TextField
            label="Product Name"
            value={Product_Name}
            onChange={(e) => setProductName(e.target.value)}
            fullWidth
            margin="normal"
            size="small"
          />
          <TextField
            label="Description"
            value={Description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            margin="normal"
            size="small"
            multiline
            rows={3}
          />
          <TextField
            label="Price"
            type="number"
            value={Price}
            onChange={(e) => setPrice(e.target.value)}
            fullWidth
            margin="normal"
            size="small"
          />
          <Typography variant="h6">เลือกวัตถุดิบที่ใช้</Typography>
          {ingredients.map(ingre => (
            <Button key={ingre.Ingredient_ID} onClick={() => handleAddIngredient(ingre.Ingredient_ID)}>
              {ingre.Ingredient_Name}
            </Button>
          ))}
          {selectedIngredients.map((ingre, index) => (
            <div key={ingre.id}>
              <Typography>{ingre.name}</Typography>
              <TextField
                type="number"
                value={ingre.quantity}
                onChange={(e) => handleQuantityChange(index, e.target.value)}
              />
            </div>
          ))}
          <Button variant="contained" color="primary" onClick={handleAddProduct} fullWidth>
            Addproduct
          </Button>
        </Box>
      </Modal>
      {/*  Modal แก้ไขสินค้า */}
      <Modal open={openEdit} onClose={() => setOpenEdit(false)}>
        <Box className="modal-box">
          <Typography variant="h6" gutterBottom> Edit Product </Typography>
          <input type="file" accept="image/*" onChange={handleImageUpload} className="file-input" />
          {Product_image}
          <TextField label="Product Name" value={Product_Name} onChange={(e) => setProductName(e.target.value)} fullWidth margin="normal" size="small" />
          <TextField label="Description" value={Description} onChange={(e) => setDescription(e.target.value)} fullWidth margin="normal" size="small" multiline rows={3} />
          <TextField label="Price" type="number" value={Price} onChange={(e) => setPrice(e.target.value)} fullWidth margin="normal" size="small" />
          <Typography variant="h6">เลือกวัตถุดิบที่ใช้</Typography>

          {/*  แสดงรายการวัตถุดิบทั้งหมด */}
          <Box display="flex" flexWrap="wrap" gap={1}>
            {ingredients.map(ingre => (
              <Button
                key={ingre.Ingredient_ID}
                onClick={() => handleAddIngredient(ingre.Ingredient_ID)}
                variant={selectedIngredients.some(sel => sel.id === ingre.Ingredient_ID) ? "contained" : "outlined"}
              >
                {ingre.Ingredient_Name}
              </Button>
            ))}
          </Box>

          {/*  แสดงวัตถุดิบที่ถูกเลือกไว้ */}
          <Typography variant="h6" sx={{ mt: 2 }}>วัตถุดิบที่ใช้</Typography>
          {selectedIngredients.length > 0 ? (
            selectedIngredients.map((ing, index) => (
              <Box key={index} display="flex" alignItems="center" gap={1}>
                <Typography>{ing.name}</Typography>
                <TextField
                  type="number"
                  value={ing.quantity}
                  onChange={(e) => handleQuantityChange(index, e.target.value)}
                  size="small"
                />
                <Button onClick={() => handleRemoveIngredient(index)} color="error">ลบ</Button>
              </Box>
            ))
          ) : (
            <Typography color="gray">ไม่มีวัตถุดิบ</Typography>
          )}

          <Button variant="contained" color="secondary" onClick={handleEditProduct} fullWidth> Save Changes </Button>
        </Box>
      </Modal>
      {/*  Popup Modal ที่แสดงกลางจอ */}
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

export default ManageProduct;
