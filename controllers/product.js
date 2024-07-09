const Stone = require("../models/product");
const User = require("../models/users");

const { awsConfigV3 } = require("../aws-s3-config/aws-configV3");
const { awsDeleteConfig } = require("../aws-s3-config/aws-delete-config");

// RECUPERATION DE TOUTES LES PIERRES//

exports.getAllProduct = async (req, res, next) => {
  const page = parseInt(req.query.page) || 1; //
  const { name } = req.query;
  const limit = 8; // Nombre d'éléments par page
  let filter = {};

  if (name) {
    filter.title = { $regex: name, $options: "i" }; // Recherche insensible à la casse
  }
  try {
    const totalStones = await Stone.countDocuments(); // Comptez le nombre total de documents dans la collection
    const skip = (page - 1) * limit; // Calculez l'index de départ pour la pagination

    const stones = await Stone.find(filter).skip(skip).limit(limit); // Utilisez skip() et limit() pour paginer les résultats

    res.status(200).json({
      total: totalStones,
      page,
      limit,
      stones,
    });
  } catch (error) {
    res.status(400).json({ error });
  }
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
        const results = await awsConfigV3(req.files);

        const newItem = new Stone({
          title: parseReq.title,
          description: parseReq.description,
          price: parseReq.price,
          size: parseReq.size,
          weight: parseReq.weight,
          origin: parseReq.origin,
          mainFile: results.mainFileName,
          file: results.filesName,
          reference: parseReq.reference,
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
  User.findOne({ _id: req.auth.userId })
    .then(async (user) => {
      if (user.role === "ADMIN") {
        const stringifyReq = JSON.stringify(req.body);
        const parseReq = JSON.parse(stringifyReq);
        const results = await awsConfigV3(req.files);
        const newItem = {
          title: parseReq.title,
          description: parseReq.description,
          price: parseReq.price,
          size: parseReq.size,
          weight: parseReq.weight,
          origin: parseReq.origin,
          $push: {
            mainFile: { $each: results.mainFileName },
            file: { $each: results.filesName },
          },

          reference: parseReq.reference,
        };
        Stone.findOneAndUpdate({ _id: req.params.id }, newItem)
          .then(() => {
            res.status(200).json({ message: "modification effectué" });
          })
          .catch((err) =>
            res.status(400).json({ message: "objet non modifié" })
          );
      } else {
        res.status(403).json({ message: "vous n'etes pas autorisé" });
      }
    })
    .catch((err) =>
      res.status(400).json({ message: "utilisateur non trouvé" })
    );
};

// SUPPRESSION D'UNE PIERRE//

exports.deleteAProduct = (req, res, next) => {
  User.findOne({ _id: req.auth.userId })
    .then((user) => {
      if (user.role === "ADMIN") {
        Stone.findOne({ _id: req.params.id })
          .then((product) => {
            const result = awsDeleteConfig(product.mainFile, product.file);

            Stone.deleteOne({ _id: req.params.id })
              .then(() => {
                res.status(200).json({ message: " objet supprimé" });
              })
              .catch((err) => res.status(400).json({ err }));
          })
          .catch((err) => res.status(401).json({ err }));
      } else {
        res.status(400).json({ message: "Utilisateur non ADMIN " });
      }
    })
    .catch((err) => res.status(400).json({ message: "objet non supprimé" }));
};

// SUPPRESSION D'UNE PHOTO //

exports.deleteAPicture = (req, res, next) => {
  User.findOne({ _id: req.auth.userId })
    .then((user) => {
      if (user.role === "ADMIN") {
        if (req.body.typeOfFile === "mainFile") {
          Stone.findOneAndUpdate(
            { _id: req.body.dataId },
            { $pull: { mainFile: req.body.pictureKey[0] } }
          ).then(() => {
            const result = awsDeleteConfig(req.body.pictureKey, null);
            res.status(200).json({ message: "supprimé" });
          });
        } else if (req.body.typeOfFile === "file") {
          Stone.findOneAndUpdate(
            { _id: req.body.dataId },
            { $pull: { file: req.body.pictureKey[0] } }
          ).then(() => {
            const result = awsDeleteConfig(null, req.body.pictureKey);

            res.status(200).json({ message: "supprimé" });
          });
        }
      } else {
        res.status(403).json({ message: "vous n'etes pas autorisé" });
      }
    })
    .catch((err) => res.status(403).json({ err }));
};
