const express = require("express");
const router = express.Router();
const manage_IngredientItem = require("../controllers/manage_IngredientItem");


router.get("/", manage_IngredientItem.getIngredientItems);
router.put("/update-exp", manage_IngredientItem.updateExpDate);

module.exports = router;
