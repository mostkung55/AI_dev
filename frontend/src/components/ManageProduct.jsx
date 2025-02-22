import React, { useState,useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
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


const ManageProduct = () => {
  useEffect(() => {
    loadData()
  },[])
  const [products, setProducts] = useState([]);
  const [Product_Name, setProductName] = useState("");
  const [Productdata, setProductdata] = useState({
    "name" : " ",
    "price" : " ",
    "description" : " ",
    "image" : " ",
  });
  const [Description, setDescription] = useState("");
  const [Price, setPrice] = useState("");
  const [Product_image, setImage] = useState(null);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [openAdd, setOpenAdd] = useState(false);  // ✅ สำหรับ Add Product
  const [openEdit, setOpenEdit] = useState(false); // ✅ สำหรับ Edit Product


  const [data,setData] = useState([]);
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

const handleEditProduct = async () => {
  if (!Product_Name || !Description || !Price) {
      alert("Please fill in all fields!");
      return;
  }

  const formData = new FormData();
  formData.append("name", Product_Name);
  formData.append("description", Description);
  formData.append("price", Price);

  // ✅ ถ้ามีการอัปโหลดไฟล์ใหม่ให้เพิ่มเข้าไป
  if (Product_image instanceof File) {
      formData.append("Product_image", Product_image); // ✅ ส่งไฟล์ไปกับ FormData
  }

  try {
      const response = await axios.put(`http://localhost:3000/api/products/${editId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" }
      });

      console.log("✅ อัปเดตสินค้าสำเร็จ!", response.data);

      loadData(); // โหลดข้อมูลใหม่

      // ✅ ล้างค่าในฟอร์ม
      setProductName("");
      setDescription("");
      setPrice("");
      setImage(null);
      setEditId(null);
      setOpenEdit(false);
  } catch (error) {
      console.error("❌ อัปเดตสินค้าไม่สำเร็จ:", error);
  }
};

  const handleAddProduct = async () => {
    if (!Product_Name || !Price || !Description || !Product_image) {
        alert("Please fill in all fields!");
        return;
    }

    // ใช้ FormData สำหรับอัปโหลดไฟล์
    const formData = new FormData();
    formData.append("name", Product_Name);
    formData.append("description", Description);
    formData.append("price", Price);
    formData.append("Product_image", Product_image); // ต้องให้ชื่อ key ตรงกับ multer

    try {
        const response = await axios.post("http://localhost:3000/api/products", formData, {
            headers: { "Content-Type": "multipart/form-data" }
        });

        console.log("✅ เพิ่มสินค้าสำเร็จ!", response.data);

        // โหลดข้อมูลใหม่
        loadData();

        // ล้างค่า input
        setProductName("");
        setDescription("");
        setPrice("");
        setImage(null);
        setOpen(false);
    } catch (error) {
        console.error("❌ เพิ่มสินค้าไม่สำเร็จ:", error);
    }
};

const handleDelete = async (id) => {
  if (!window.confirm("คุณแน่ใจหรือไม่ที่จะลบสินค้านี้?")) return;

  try {
    await axios.delete(`http://localhost:3000/api/products/${id}`);
    setData(data.filter((product) => product.Product_ID !== id)); // อัปเดต state
    console.log(`✅ ลบสินค้าสำเร็จ: ${id}`);
  } catch (error) {
    console.error("❌ ลบสินค้าไม่สำเร็จ:", error);
  }
};

const handleEdit = (product) => {
  setProductName(product.Product_Name);
  setDescription(product.Description);
  setPrice(product.Price);
  setImage(product.Product_image);
  setEditId(product.Product_ID);
  setOpenEdit(true); // ✅ เปิด Modal แก้ไข
};

  return (
    <div className="container">
      <Typography variant="h5" align="center" gutterBottom>
        Manage Product
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow style={{ background: "#c5e1a5" }}>
              <TableCell>No.</TableCell>
              <TableCell>Pic.</TableCell>
              <TableCell>Product Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Price</TableCell>
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
          {Product_image && (
            <img src={Product_image} alt="Preview" style={{ width: "100px", height: "100px", marginBottom: "10px" }} />
          )}
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
          <Button variant="contained" color="primary" onClick={handleAddProduct} fullWidth>
            Addproduct
          </Button>
        </Box>
      </Modal>
      {/* ✏️ Modal แก้ไขสินค้า */}
        <Modal open={openEdit} onClose={() => setOpenEdit(false)}>
          <Box className="modal-box">
            <Typography variant="h6" gutterBottom> Edit Product </Typography>
            <input type="file" accept="image/*" onChange={handleImageUpload} className="file-input" />
            {Product_image && (
              <img src={Product_image} alt="Preview" style={{ width: "100px", height: "100px", marginBottom: "10px" }} />
            )}
            <TextField label="Product Name" value={Product_Name} onChange={(e) => setProductName(e.target.value)} fullWidth margin="normal" size="small"/>
            <TextField label="Description" value={Description} onChange={(e) => setDescription(e.target.value)} fullWidth margin="normal" size="small" multiline rows={3}/>
            <TextField label="Price" type="number" value={Price} onChange={(e) => setPrice(e.target.value)} fullWidth margin="normal" size="small"/>
            <Button variant="contained" color="secondary" onClick={handleEditProduct} fullWidth> Save Changes </Button>
          </Box>
        </Modal>
    </div>
  );
};

export default ManageProduct;
