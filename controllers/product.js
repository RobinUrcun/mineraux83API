const Stone = require("../models/product");
const User = require("../models/users");
const { awsConfig } = require("../aws-s3-config/aws-config");

// RECUPERATION DE TOUTES LES PIERRES//

exports.getAllProduct = (req, res, next) => {
  Stone.find()
    .then((stone) => res.status(200).json(stone))
    .catch((error) => res.status(400).json({ error }));
};

// RECUPERATION DE PIERRE //

exports.getAProduct = (req, res, next) => {
  Stone.find({ _id: { $in: req.params.id.split(",") } })
    .then((stone) => res.status(200).json(stone))
    .catch((error) => res.status(400).json({ error }));
};
// CREATION D'UNE PIERRE//

exports.createAProduct = (req, res, next) => {
  User.findOne({ _id: req.auth.userId })
    .then(async (user) => {
      if (user.role === "ADMIN") {
        const stringifyReq = JSON.stringify(req.body);
        const parseReq = JSON.parse(stringifyReq);
        // console.log("req.file", req.files);
        const results = await awsConfig(req.files);
        const file1 = results;
        // console.log("file1", file1);
        const arrayFiles = [];
        for (let i = 1; i < results.length; i++) {
          arrayFiles.push(results[i].Location);
        }
        // console.log(results);
        const newItem = new Stone({
          title: parseReq.title,
          description: parseReq.description,
          price: parseInt(parseReq.price),
          size: parseReq.size,
          weight: parseInt(parseReq.weight),
          origin: parseReq.origin,
          mainFile: results[0].Location,
          file: arrayFiles,
        });
        await newItem
          .save()
          .then(() => res.status(201).json({ message: "objet créé" }))
          .catch((error) => res.status(400).json({ error: "save" }));
      } else {
        res.status(403).json({ message: "vous n'etes pas autorisé" });
      }
    })
    .catch((error) => res.status(400).json({ error: "general" }));
};

// MODIFICATION D'UNE PIERRE//

exports.modifyAProduct = (req, res, next) => {
  Stone.updateOne({ _id: req.params.id }, { ...req.body, _id: req.params.id })
    .then(() => res.status(200).json({ message: "Objet modifié !" }))
    .catch((error) => res.status(400).json({ error }));
};
// SUPPRESSION D'UNE PIERRE//

// exports.deleteAProduct = (req, res, next) => {
//   Stone.deleteOne({ _id: req.params.id })
//     .then(() => res.status(200).json({ message: "objet supprimé" }))
//     .catch((error) => res.status(400).json({ error }));
// };
exports.deleteAProduct = async (req, res, next) => {
  try {
    console.log(req.body);
    const results = await awsConfig(req.files);
    res.status(200).json({ message: results });
  } catch (err) {
    res.status(400).json({ erreur: "middlewarErreur", err });
  }
};
