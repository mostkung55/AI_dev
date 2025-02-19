import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  TextField,
} from "@mui/material";
import { Delete, Edit } from "@mui/icons-material";
import "./ManageProduct.css"; // ไฟล์ CSS

const ManageProduct = () => {
  const [products, setProducts] = useState([]);
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState(null);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddProduct = () => {
    if (!productName || !description || !price || !image) return;

    const newProduct = {
      id: uuidv4(),
      name: productName,
      description,
      price,
      image,
    };

    setProducts([...products, newProduct]);
    setProductName("");
    setDescription("");
    setPrice("");
    setImage(null);
  };

  const handleDelete = (id) => {
    setProducts(products.filter((product) => product.id !== id));
  };

  return (
    <div className="container">
      <div className="form-container">
        <Typography variant="h5" gutterBottom>
          Add New Product
        </Typography>

        <input type="file" accept="image/*" onChange={handleImageUpload} className="file-input" />

        <TextField
          label="Product Name"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          fullWidth
          margin="normal"
          size="small"
        />

        <TextField
          label="Description"
          value={description}
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
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          fullWidth
          margin="normal"
          size="small"
        />

        <Button variant="contained" color="primary" onClick={handleAddProduct}>
          Add Product
        </Button>
      </div>

      <div className="product-list">
        {products.map((product) => (
          <Card key={product.id} className="product-card">
            <CardMedia component="img" height="150" image={product.image} alt={product.name} />
            <CardContent>
              <Typography variant="h6">{product.name}</Typography>
              <Typography variant="body2" color="textSecondary">
                {product.description}
              </Typography>
              <Typography variant="h6" color="primary">
                ${product.price}
              </Typography>

              <div className="action-buttons">
                <Button variant="contained" color="warning" size="small" startIcon={<Edit />}>
                  Edit
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  size="small"
                  startIcon={<Delete />}
                  onClick={() => handleDelete(product.id)}
                >
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ManageProduct;
