const Stone = require("../models/product");
const User = require("../models/users");
// RECUPERATION DE TOUTES LES PIERRES//

exports.getAllProduct = (req, res, next) => {
  Stone.find()
    .then((stone) => res.status(200).json(stone))
    .catch((error) => res.status(400).json({ error }));
};

// RECUPERATION D'UNE PIERRE //

exports.getAProduct = (req, res, next) => {
  Stone.find({ _id: req.params.id })
    .then((stone) => {
      res.status(200).json(stone);
    })
    .catch((err) => res.status(400).json({ err }));
};
// CREATION D'UNE PIERRE//

exports.createAProduct = (req, res, next) => {
  User.findOne({ _id: req.auth.userId })
    .then((user) => {
      if (user.role === "ADMIN") {
        const NewItem = new Stone({
          ...req.body,
        });
        NewItem.save()
          .then(() => res.status(201).json({ message: "objet créé" }))
          .catch((error) => res.status(400).json({ error }));
      } else {
        res.status(403).json({ message: "vous n'etes pas autorisé" });
      }
    })
    .catch((error) => res.status(400).json({ error }));
};

// MODIFICATION D'UNE PIERRE//

exports.modifyAProduct = (req, res, next) => {
  Stone.updateOne({ _id: req.params.id }, { ...req.body, _id: req.params.id })
    .then(() => res.status(200).json({ message: "Objet modifié !" }))
    .catch((error) => res.status(400).json({ error }));
};
// SUPPRESSION D'UNE PIERRE//

exports.deleteAProduct = (req, res, next) => {
  Stone.deleteOne({ _id: req.params.id })
    .then(() => res.status(200).json({ message: "objet supprimé" }))
    .catch((error) => res.status(400).json({ error }));
};

// RECUPERATION DES PRODUITS DU PANIER//

exports.getCartProduct = (req, res, next) => {
  Stone.find({ _id: { $in: req.params.id.split(",") } })
    .then((stone) => res.status(200).json(stone))
    .catch((error) => res.status(400).json({ error }));
};

// RECUPERATION DES FRAIS DE LIVAISON //

exports.getShippingCost = (req, res, next) => {
  const shippingCost = [{ contry: France }];
};
