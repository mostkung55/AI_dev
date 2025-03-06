const express = require('express');
const router = express.Router();
const manage_Ingredient = require('../controllers/manage_Ingredient'); 


router.post("/", manage_Ingredient.createIngredient); 
router.get("/", manage_Ingredient.getIngredients);  
router.delete("/:id", manage_Ingredient.deleteIngredient); 



module.exports = router;
