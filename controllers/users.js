const User = require("../models/users");
const Stone = require("../models/product");
const Orders = require("../models/orders");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const {
  shippingCalcFunction,
} = require("../shippingFunction/shippingCalcFunction");
const product = require("../models/product");
const { awsDeleteConfig } = require("../aws-s3-config/aws-delete-config");
const { log } = require("console");
const { json } = require("body-parser");

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
              if (req.body.cart) {
                User.findOneAndUpdate(
                  { email: user.email },
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
                  .catch((err) => res.status(404).json({ err }));
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
        res.status(401).json({ message: "Vous n'etes pas administrateur" });
      }
    })
    .catch((error) => res.status(404).json({ error }));
};

// MODIFICATION DES INFORMATIONS D'UN UTILISATEUR //

exports.modifyUser = (req, res, next) => {
  User.findOne({ _id: req.auth.userId })

    .then((user) => {
      if (!user) {
        res.status(401).json({ message: "non autorisé" });
      } else {
        bcrypt
          .compare(req.body.actualPassword, user.password)
          .then((password) => {
            if (!password) {
              return res
                .status(403)
                .json({ message: "mot de passe actuel eroné" });
            } else {
              if (req.body.newPassword === "") {
                const newUserInfo = {
                  password: user.password,
                  name: req.body.name,
                  surname: req.body.surname,
                  role: user.role,
                  cart: user.cart,
                };
                User.updateOne({ _id: req.auth.userId }, newUserInfo)
                  .then(() => {
                    res.status(200).json({ message: "Informations modifiées" });
                  })
                  .catch((err) => res.status(400).json({ err }));
              } else {
                bcrypt
                  .hash(req.body.newPassword, 10)
                  .then((hash) => {
                    const newUserInfo = {
                      password: hash,
                      name: req.body.name,
                      surname: req.body.surname,
                      role: user.role,
                      cart: user.cart,
                    };
                    User.updateOne({ _id: req.auth.userId }, newUserInfo)
                      .then(() => {
                        res
                          .status(200)
                          .json({ message: "Informations modifiées" });
                      })
                      .catch((err) => res.status(400).json({ err }));
                  })
                  .catch((err) => res.status(404).json({ err }));
              }
            }
          })
          .catch((err) => res.status(401).json({ err }));
      }
    })
    .catch((err) => res.status(404).json({ err }));
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

// COMMANDE PAYPAL //

async function handleResponse(response) {
  try {
    const jsonResponse = await response.json();
    return {
      jsonResponse,
      httpStatusCode: response.status,
    };
  } catch (err) {
    const errorMessage = await response.text();
    throw new Error(errorMessage);
  }
}

const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PORT = 8888 } = process.env;
const base = "https://api-m.sandbox.paypal.com";

const createOrder = async (cart) => {
  const accessToken = await generateAccessToken();
  const url = `${base}/v2/checkout/orders`;
  const payload = {
    intent: "CAPTURE",
    purchase_units: [
      {
        amount: {
          currency_code: "EUR",
          value: cart / 100,
        },
      },
    ],
  };

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      // Uncomment one of these to force an error for negative testing (in sandbox mode only). Documentation:
      // https://developer.paypal.com/tools/sandbox/negative-testing/request-headers/
      // "PayPal-Mock-Response": '{"mock_application_codes": "MISSING_REQUIRED_PARAMETER"}'
      // "PayPal-Mock-Response": '{"mock_application_codes": "PERMISSION_DENIED"}'
      // "PayPal-Mock-Response": '{"mock_application_codes": "INTERNAL_SERVER_ERROR"}'
    },
    method: "POST",
    body: JSON.stringify(payload),
  });

  return handleResponse(response);
};

const generateAccessToken = async () => {
  try {
    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      throw new Error("MISSING_API_CREDENTIALS");
    }
    const auth = Buffer.from(
      PAYPAL_CLIENT_ID + ":" + PAYPAL_CLIENT_SECRET
    ).toString("base64");
    const response = await fetch(`${base}/v1/oauth2/token`, {
      method: "POST",
      body: "grant_type=client_credentials",
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    res.status(400).json({ error });
  }
};

const captureOrder = async (orderID) => {
  const accessToken = await generateAccessToken();
  const url = `${base}/v2/checkout/orders/${orderID}/capture`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return handleResponse(response);
};

exports.orders = async (req, res, next) => {
  User.findOne({ _id: req.auth.userId })
    .then((user) => {
      Stone.find({ _id: { $in: user.cart } })
        .then(async (data) => {
          const { deliveryInfo } = req.body;
          const totalcart = await shippingCalcFunction(
            data,
            deliveryInfo.deliveryCompany,
            deliveryInfo.country
          );

          try {
            // use the cart information passed from the front-end to calculate the order amount detals

            const { jsonResponse, httpStatusCode } = await createOrder(
              totalcart
            );
            res.status(httpStatusCode).json(jsonResponse);
          } catch (error) {
            res.status(500).json({ error: "Failed to create order." });
          }
        })
        .catch((err) => res.status(400).json({ err }));
    })
    .catch((err) => res.status(403).json({ err }));
};

exports.ordersCapture = async (req, res, next) => {
  try {
    const { orderID } = req.params;
    const { jsonResponse, httpStatusCode } = await captureOrder(orderID);

    if (httpStatusCode === 201) {
      User.findOne({ _id: req.auth.userId })
        .then(async (user) => {
          Stone.find({ _id: { $in: user.cart } }).then(async (stone) => {
            const productsInfo = [];
            for (let index = 0; index < stone.length; index++) {
              const productInfo = {
                title: stone[index].title,
                price: stone[index].price,
                reference: stone[index].reference,
              };
              productsInfo.push(productInfo);
            }

            const totalCart = Math.round(
              parseFloat(
                jsonResponse.purchase_units[0].payments.captures[0].amount.value
              ) * 100
            );
            const { deliveryInfo, commandeInfo } = req.body;
            const date = Date.now().toString();
            const newOrder = new Orders({
              userName: user.name,
              userId: user._id,
              userSurname: user.surname,
              userEmail: user.email,
              phone: commandeInfo.phone,
              date: date,
              products: productsInfo,
              orderID: orderID,
              total: totalCart,
              deliveryName: commandeInfo.userName,
              deliverySurname: commandeInfo.userSurname,
              deliveryCompany: deliveryInfo.deliveryCompany,
              deliveryShopName: deliveryInfo.name,
              deliveryRoad: deliveryInfo.road,
              deliveryCP: deliveryInfo.CP,
              deliveryCity: deliveryInfo.city,
              deliveryCountry: deliveryInfo.country,
            });
            const deleteAwsPromise = [];
            for (let index = 0; index < stone.length; index++) {
              deleteAwsPromise.push(
                awsDeleteConfig(stone[index].mainFile, stone[index].file)
              );
            }

            await Promise.all([
              newOrder.save().then(() => {}),
              Promise.all(deleteAwsPromise),
              Stone.deleteMany({ _id: { $in: user.cart } }),
              User.findOneAndUpdate(
                { _id: req.auth.userId },
                { $set: { cart: [] } }
              ),
            ])
              .then(async () => {
                res.status(httpStatusCode).json(jsonResponse);
              })
              .catch((error) => res.status(400).json({ error: "save" }));
          });
        })
        .catch((err) => res.status(400).json({ err }));
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to capture order." });
  }
};

// RECUPERATION DES FACTURES CLIENTS //

exports.getClientOrders = (req, res, next) => {
  Orders.find({ userId: req.auth.userId })
    .sort({ date: -1 })
    .then((orders) => {
      const orderList = [];
      for (let index = 0; index < orders.length; index++) {
        const order = {
          orderID: orders[index].orderID,
          products: orders[index].products,
          total: orders[index].total,
          date: orders[index].date,
        };
        orderList.push(order);
      }
      res.status(200).json({ orderList });
    })
    .catch((err) => res.status(400).json({ err }));
};

// RECUPERATION DE TOUTES LES FACTURES //

exports.getAllOrders = (req, res, next) => {
  User.findOne({ _id: req.auth.userId })
    .then((user) => {
      if (user.role == "ADMIN") {
        Orders.find()
          .sort({ date: -1 })
          .then((orders) => {
            res.status(200).json({ orderList: orders });
          })
          .catch((err) => res.status(400).json({ err }));
      } else {
        res.status(401).json({ message: "non-authorisé" });
      }
    })
    .catch((err) => res.status(400).json({ err }));
};

// RECUPERER UNE COMMANDE //

exports.getOrderId = (req, res, next) => {
  Orders.find({ orderID: req.params.id })
    .then((data) => {
      res.status(200).json({ data });
    })
    .catch((err) => res.status(400).json({ err }));
};

// OUBLIE DU MOT DE PASSE //

exports.forgotPassword = (req, res, next) => {
  User.findOne({ email: req.body.email })
    .then(async (response) => {
      if (!response) {
        res.status(400).json({ err });
      } else {
        const token = jwt.sign({ userId: response._id }, "phrase_de_cryptage", {
          expiresIn: "1h",
        });
        const tokenExpires = Date.now() + 3600000;

        // SAUVEGARDE DU TOKEN //
        const transporter = nodemailer.createTransport({
          service: "Gmail",
          auth: {
            user: process.env.NODEMAILER_USER,
            pass: process.env.NODEMAILER_PASSWORD,
          },
        });
        const mailOptions = {
          from: "mineraux83API@gmail.com",
          to: response.email,
          subject: "Réinitialisation de votre mot de passe",
          text: `Cliquez sur ce lien pour réinitialiser votre mot de passe : www.lithosphere83.fr/reset-password/${token}`,
        };

        await User.updateOne(
          { _id: response._id },
          {
            resetPasswordToken: token,
            resetPasswordExpires: tokenExpires,
          }
        )
          .then(() => {
            transporter.sendMail(mailOptions, (err) => {
              if (err) {
                return res.status(500).json({ err });
              }
              res.status(200).send("Email de réinitialisation envoyé.");
            });
          })
          .catch((err) => res.status(400).json({ error: "Update" }));
      }
    })
    .catch((err) => res.status(400).json({ error: "find" }));
};

// REINITIALISATION DU MOT DE PASSE //

exports.resetPassword = (req, res, next) => {
  bcrypt
    .hash(req.body.password, 10)
    .then((hash) => {
      User.findOneAndUpdate(
        {
          _id: req.auth.userId,
          resetPasswordToken: req.headers.authorization.split(" ")[1],
          resetPasswordExpires: { $gt: Date.now() },
        },
        {
          password: hash,
          resetPasswordToken: "undefined",
          resetPasswordExpires: 0,
        },
        { new: true }
      )
        .then((user) => {
          if (!user) {
            res.status(400).json({ err: "erreur update" });
          } else {
            res.status(200).json({ message: "Mot de passe modifié" });
          }
        })
        .catch((err) => res.status(400).json({ err: "erreur update" }));
    })

    .catch((err) => res.status(400).json({ erreur: "hash du mot de passe" }));
};
