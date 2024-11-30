const Stone = require("../models/product");
const User = require("../models/users");

const { awsConfigV3 } = require("../aws-s3-config/aws-configV3");
const { awsDeleteConfig } = require("../aws-s3-config/aws-delete-config");
const { log } = require("console");

// // RECUPERATION DE TOUTES LES PIERRES//

exports.getAllProduct = async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const { name, sort, categorie } = req.query;
  const limit = 12;
  let filter = {};

  if (name) {
    filter.title = { $regex: name, $options: "i" };
  }

  if (categorie) {
    filter.categories = categorie;
  }
  console.log(filter);

  let sortOption = {};
  if (sort === "new") {
    sortOption = { createdAt: -1 };
  } else if (sort === "ascending") {
    sortOption = { price: 1 };
  } else if (sort === "decreasing") {
    sortOption = { price: -1 };
  }

  try {
    const totalStones = await Stone.countDocuments(filter);

    const skip = (page - 1) * limit;

    const stones = await Stone.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

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

// exports.getAllProduct = async (req, res, next) => {
//   const page = parseInt(req.query.page) || 1;
//   const { name, sort } = req.query;
//   const limit = 8;
//   let filter = {};

//   if (name) {
//     filter.title = { $regex: name, $options: "i" };
//   }

//   let sortOption = {};
//   if (sort === "new") {
//     sortOption = { createdAt: -1 }; // Sort by creation date
//   } else if (sort === "ascending") {
//     sortOption = { price: 1 }; // Sort by price ascending
//   } else if (sort === "decreasing") {
//     sortOption = { price: -1 }; // Sort by price descending
//   }

//   try {
//     const totalStones = await Stone.countDocuments();
//     const skip = (page - 1) * limit;

//     const stones = await Stone.find(filter)
//       .sort(sortOption) // Apply sorting
//       .skip(skip)
//       .limit(limit);

//     res.status(200).json({
//       total: totalStones,
//       page,
//       limit,
//       stones,
//     });
//   } catch (error) {
//     res.status(400).json({ error });
//   }
// };

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
        console.log(parseReq);
        const newItem = new Stone({
          title: parseReq.title,
          description: parseReq.description,
          price: parseReq.price,
          size: parseReq.size,
          weight: parseReq.weight,
          origin: parseReq.origin,
          mainFile: results.mainFileName,
          file: results.filesName,
          categories: parseReq.categories,
          reference: parseReq.reference,
          createdAt: Date.now(),
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
          categories: parseReq.categories,
          $push: {
            mainFile: { $each: results.mainFileName },
            file: { $each: results.filesName },
          },

          reference: parseReq.reference,
        };
        console.log(newItem);

        Stone.findOneAndUpdate({ _id: req.params.id }, newItem)
          .then(() => {
            Stone.find({ _id: req.params.id }).then((data) => {
              res.status(200).json({ data });
            });
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
