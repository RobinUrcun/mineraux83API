const Product = require("../models/product");
const Stone = require("../models/product");

// RECUPERATION DE TOUTES LES PIERRES//

exports.getAllProduct = (req, res, next) => {
  Stone.find()
    .then((stone) => res.status(200).json(stone))
    .catch((error) => res.status(400).json({ error }));
};

// RECUPERATION D'UNE SEULE PIERRE//

exports.getAProduct = (req, res, next) => {
  Stone.findOne({ _id: req.params.id })
    .then((stone) => res.status(200).json(stone))
    .catch((error) => res.status(400).json({ error }));
};

// CREATION D'UNE PIERRE//

exports.createAProduct = (req, res, next) => {
  const NewItem = new Stone({
    ...req.body,
  });
  NewItem.save()
    .then(() => res.status(201).json({ message: "objet créé" }))
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
