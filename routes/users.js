const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");

const usersController = require("../controllers/users");

router.post("/signup", usersController.signUp);
router.post("/login", usersController.logIn);
router.get("/role", auth, usersController.role);
router.get("/userInfo", auth, usersController.userInfo);
router.put("/userInfo", auth, usersController.modifyUser);
router.get("/cart", auth, usersController.getCart);
router.put("/cart", auth, usersController.modifyCart);
router.delete("/cart", auth, usersController.deleteCart);
router.post("/orders", auth, usersController.orders);
router.post("/orders/:orderID/capture", auth, usersController.ordersCapture);
router.get("/getClientOrders", auth, usersController.getClientOrders);
router.get("/getAllOrders", auth, usersController.getAllOrders);
router.get("/order/:id", auth, usersController.getOrderId);
router.post("/forgot-password", usersController.forgotPassword);
module.exports = router;
