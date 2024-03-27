const User = require("../models/users");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

// CREATION D'UTILISATEUR //

exports.signUp = (req, res, next) => {
  bcrypt
    .hash(req.body.password, 10)
    .then((hash) => {
      const user = new User({
        email: req.body.email,
        password: hash,
        name: req.body.name,
        surname: req.body.surname,
        role: "user",
      });
      user
        .save()
        .then(() => res.status(201).json({ message: "utilisateur crée" }))
        .catch((error) => res.status(400).json({ error }));
    })
    .catch((error) => res.status(500).json({ error }));
};

// CONNECTION D'UN UTILISATEUR //

exports.logIn = (req, res, next) => {
  User.findOne({ email: req.body.email })
    .then((user) => {
      if (!user) {
        return res
          .status(403)
          .json({ message: "email ou mot de passe invalide" });
      } else {
        bcrypt
          .compare(req.body.password, user.password)
          .then((password) => {
            if (!password) {
              return res
                .status(403)
                .json({ message: "email ou mot de passe invalide" });
            } else {
              res.status(200).json({
                userId: user._id,
                userRole: user.role,
                token: jwt.sign(
                  {
                    userId: user._id,
                  },
                  "phrase_de_cryptage",
                  { expiresIn: "24h" }
                ),
              });
            }
          })
          .catch((error) => res.status(400).json({ error }));
      }
    })
    .catch((error) => res.status(400).json({ error }));
};

// RECUPERATION DES INFO DE L'UTILISATEUR //

exports.role = (req, res, next) => {
  User.findOne({ _id: req.auth.userId })
    .then((user) => {
      if (user.role == "ADMIN") {
        res.status(200).json({ user });
      } else {
        res.status(403).json({ message: "Vous n'etes pas administrateur" });
      }
    })
    .catch((error) => res.status(404).json({ error }));
};

// RECUPERATION DU PANIER DU CLIENT //

exports.getUserCart = (req, res, next) => {
  User.findOne({ _id: req.auth.userId })
    .then((user) => {
      res.status(200).json({ cart: user.cart });
    })
    .catch((err) => res.status(400).json({ err }));
};

// AJOUTER AU PANIER //
exports.modifyCart = (req, res, next) => {
  console.log(req.body.articleId);
  User.findOneAndUpdate(
    { _id: req.auth.userId },
    { $addToSet: { cart: req.body.articleId } }
  )
    .then(res.status(200).json({ message: "panier mis a jour" }))
    .catch((err) => res.status(404).json({ err }));
};
