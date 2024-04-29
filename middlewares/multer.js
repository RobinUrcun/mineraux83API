const express = require("express");
const multer = require("multer");
const MIME_TYPES = {
  "image/jpg": "jpg",
  "image/jpeg": "jpg",
  "image/png": "png",
};

// const storage = multer.diskStorage({
//   destination: (req, file, callback) => {
//     callback(null, "images");
//   },
//   filename: (req, file, callback) => {
//     const name = file.originalname.split(" ").join("_");
//     const extension = MIME_TYPES[file.mimetype];
//     callback(null, name + Date.now() + "." + extension);
//   },
// });
const storage = multer.memoryStorage();
console.log("storage", storage);

// const fileFilter = (req, file, cb) => {
//   console.log("file", file);
//   if (file.mimetype.split("/")[0] === "image") {
//     cb(null, true);
//   } else {
//     console.log("erreur test");
//     cb(new Error("le fichier n'est pas une image"), false);
//   }
// };
module.exports = multer({ storage }).fields([
  { name: "mainFile", maxCount: 1 },
  { name: "files", maxCount: 9 },
]);
// .single("file");
