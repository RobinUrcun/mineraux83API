const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");

const usersController = require("../controllers/users");

router.post("/signup", usersController.signUp);
router.post("/login", usersController.logIn);
router.get("/role", auth, usersController.role);
router.get("/userInfo", auth, usersController.userInfo)
router.get("/cart", auth, usersController.getCart);
router.put("/cart/", auth, usersController.modifyCart);
router.delete("/cart", auth, usersController.deleteCart);
module.exports = router;
