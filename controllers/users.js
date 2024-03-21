const users = require("../models/users");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

// CREATION D'UTILISATEUR //

exports.signUp = (req, res, next) => {
  bcrypt
    .hash(req.body.password, 10)
    .then((hash) => {
      const User = new users({
        email: req.body.email,
        password: hash,
        name: req.body.name,
        surname: req.body.surname,
        role: "user",
      });
      User.save()
        .then(() => res.status(201).json({ message: "utilisateur crée" }))
        .catch((error) => res.status(400).json({ error }));
    })
    .catch((error) => res.status(500).json({ error }));
};

// CONNECTION D'UN UTILISATEUR //

exports.logIn = (req, res, next) => {
  users
    .findOne({ email: req.body.email })
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

exports.info = (req, res, next) => {
  users
    .findOne({ _id: req.params.id })
    .then((user) => {
      res.status(200).json({ user });
    })
    .catch((error) => res.status(404).json({ error }));
};
