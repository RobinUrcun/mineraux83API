const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const multer = require("../middlewares/multer");

const productController = require("../controllers/product");

router.get("/", productController.getAllProduct);
router.get("/:id", productController.getAProduct);
router.get("/");
router.post("/", auth, multer, productController.createAProduct);
router.put("/:id", auth, productController.modifyAProduct);

//REMETTRE MIDDLEWAR D'AUTHENTIFICATION //

router.delete("/:id", multer, productController.deleteAProduct);

module.exports = router;
