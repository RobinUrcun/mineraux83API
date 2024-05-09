const express = require("express");
const multer = require("multer");

const storage = multer.memoryStorage();

module.exports = multer({ storage }).fields([
  { name: "mainFile", maxCount: 1 },
  { name: "files", maxCount: 9 },
]);
