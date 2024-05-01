const express = require("express");
const multer = require("multer");

const storage = multer.memoryStorage();
console.log("multer Ok");

module.exports = multer({ storage }).fields([
  { name: "mainFile", maxCount: 1 },
  { name: "files", maxCount: 9 },
]);
