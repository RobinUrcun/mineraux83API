const express = require("express");
const router = express.Router();
const sendMessageController = require("../controllers/sendMessage");

router.post("/", sendMessageController.sendMessage);

module.exports = router;
