const db = require("../db"); // นำเข้า database connection

// CREATE: เพิ่มสินค้าใหม่
exports.createProduct = async (req, res) => {
    try {
        const { name, price, description, image } = req.body;
        const sql = "INSERT INTO Product (Product_Name, Price, Description,Product_image) VALUES (?, ?, ?, ?)";

        const [result] = await db.query(sql, [name, price, description, image] );
        res.status(201).json({ message: 'Product created', productId: result.insertId });
    } catch (error) {
        console.log(error)
    }
};

// READ: ดึงข้อมูลสินค้าทั้งหมด
exports.getAllProducts = async (req, res) => {
    try {
        const [products] = await db.query("SELECT * FROM Product");
        res.status(200).json(products)
    } catch (error) {
        console.log(error)
    }
    

};

// READ: ดึงข้อมูลสินค้าตาม ID
exports.getProductById = async (req, res) => {
     
    try {
        const { id } = req.params;
        const [product] = await db.query("SELECT * FROM Product WHERE Product_ID = ?", id);
       
        if (product.length === 0) {
            return res.status(404).json({ message: "Product not found" });
        }
        res.status(200).json(product[0]);
    } catch (error) {
        console.log(error)
    }
};

// UPDATE: อัปเดตข้อมูลสินค้า
exports.updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, price, description, image } = req.body;
        const sql = "UPDATE Product SET Product_Name = ?, Price = ?, Description = ?, Product_image = ? WHERE Product_ID = ?";
    
        const [product] = await db.query(sql, [name, price, description, image, id])

        if (product.affectedRows === 0) {
            return res.status(404).json({ message: "Product not found" });
        }
        res.status(200).json({ message: "Product updated successfully" });

    } catch (error) {
        console.log(error)
    }
 
};

// DELETE: ลบสินค้า
exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const [product] = await db.query("DELETE FROM Product WHERE Product_ID = ?", [id]);

        if (product.affectedRows === 0) {
            return res.status(404).json({ message: "Product not found" });
        }
        res.status(200).json({ message: "Product deleted successfully" });
        
    } catch (error) {
        console.log(error)
    }
    
};
