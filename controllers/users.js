const User = require("../models/users");
const Stone = require("../models/product");
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
              if (req.body.cart === null) {
                console.log("panier vide");
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
              } else {
                console.log("item dans panier");
                User.findOneAndUpdate(
                  { email: req.body.email },
                  { $addToSet: { cart: { $each: JSON.parse(req.body.cart) } } }
                )
                  .then(
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
                    })
                  )
                  .catch((err) =>
                    res.status(404).json({ message: " impossible de addtoset" })
                  );
              }
            }
          })
          .catch((error) => res.status(400).json({ error }));
      }
    })
    .catch((error) => res.status(400).json({ error }));
};

// RECUPERATION DES INFO DE L'UTILISATEUR //

exports.userInfo = (req, res, next) => {
  User.findOne({ _id: req.auth.userId })
    .then((userInfo) => {
      const data = {
        email: userInfo.email,
        name: userInfo.name,
        surname: userInfo.surname,
      };
      res.status(200).json(data);
    })
    .catch((err) => res.status(404).json({ err }));
};

// RECUPERATION DU ROLE DE L'UTILISATEUR //

exports.role = (req, res, next) => {
  User.findOne({ _id: req.auth.userId })
    .then((user) => {
      if (user.role == "ADMIN") {
        res.status(200).json({ role: user.role });
      } else {
        res.status(403).json({ message: "Vous n'etes pas administrateur" });
      }
    })
    .catch((error) => res.status(404).json({ error }));
};

// RECUPERATION DU PANIER //

exports.getCart = (req, res, next) => {
  User.findOne({ _id: req.auth.userId })
    .then((user) => {
      Stone.find({ _id: { $in: user.cart } })
        .then((data) => {
          res.status(200).json(data);
        })
        .catch((err) => res.status(400).json({ err }));
    })
    .catch((err) => res.status(403).json({ err }));
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

// SUPPRIMER UN OBJET DU PANIER //

exports.deleteCart = (req, res, next) => {
  User.findOneAndUpdate(
    { _id: req.auth.userId },
    { $pull: { cart: req.body.articleId } }
  )
    .then(res.status(200).json({ message: "panier mis a jour" }))
    .catch((err) => res.status(404).json({ err }));
};
