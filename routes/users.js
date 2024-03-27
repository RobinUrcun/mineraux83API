const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");

const usersController = require("../controllers/users");

router.post("/signup", usersController.signUp);
router.post("/login", usersController.logIn);
router.get("/role", auth, usersController.role);
router.get("/cart/", auth, usersController.getUserCart);
router.put("/cart/", auth, usersController.modifyCart);

module.exports = router;
