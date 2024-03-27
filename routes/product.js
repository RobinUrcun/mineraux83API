const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");

const productController = require("../controllers/product");

router.get("/", productController.getAllProduct);
router.get("/:id", productController.getAProduct);
router.post("/", auth, productController.createAProduct);
router.put("/:id", auth, productController.modifyAProduct);
router.delete("/:id", auth, productController.deleteAProduct);
router.get("/user/cart", auth, productController.getCart);

module.exports = router;
