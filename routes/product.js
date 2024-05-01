const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const multer = require("../middlewares/multer");

const productController = require("../controllers/product");

router.get("/", productController.getAllProduct);
router.get("/:id", productController.getAProduct);
router.post("/", auth, multer, productController.createAProduct);
router.put("/:id", auth, multer, productController.modifyAProduct);
router.delete("/singlePicture", auth, productController.deleteAPicture);
router.delete("/singleProduct", auth, productController.deleteAProduct);

module.exports = router;
