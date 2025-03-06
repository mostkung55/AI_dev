import './App.css';
import Side from './layout/Side';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import axios from 'axios';

import Dashboard from './components/Dashboard';
import ManageIngre from './components/ManageIngre';
import ManageOrder from './components/ManageOrder';
import ManageProduct from './components/ManageProduct';
import OrderItem from "./components/Order_item";
import IngredientItem from './components/Ingredient_item';
import { Button } from '@mui/material';


function App() {
  return (
    <>
      <Router>
      <div style={{ display: "flex" }}>  {/*  ใช้ flex ทำ Sidebar + Content */}
        <Side />  {/*  Sidebar อยู่ทางซ้าย */}
        <div style={{ flex: 1, padding: "20px" }}> {/*  Content ทางขวา */}
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/Product" element={<ManageProduct />} />
            <Route path="/Ingre" element={<ManageIngre />} />
            <Route path="/ingredient_item" element={<IngredientItem />} />

            <Route path="/Order" element={<ManageOrder />} />
            <Route path="/Order_item" element={<OrderItem />} />
            
          </Routes>
        </div>
      </div>
    </Router>
    {/* <Button onClick={test}>testtt</Button> */}
        
    </>
  )
}

export default App
