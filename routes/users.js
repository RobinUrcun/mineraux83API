const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");

const usersController = require("../controllers/users");

router.post("/signup", usersController.signUp);
router.post("/login", usersController.logIn);
router.get("/info/:id", auth, usersController.info);

module.exports = router;
