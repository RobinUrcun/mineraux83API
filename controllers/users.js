const User = require("../models/users");
const Stone = require("../models/product");
const Orders = require("../models/orders");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const {
  shippingCalcFunction,
} = require("../shippingFunction/shippingCalcFunction");
const product = require("../models/product");
const { awsDeleteConfig } = require("../aws-s3-config/aws-delete-config");

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
        res.status(403).json({ message: "Vous n'etes pas administrateur" });
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
  // use the cart information passed from the front-end to calculate the purchase unit details
  console.log(
    "shopping cart information passed from the frontend createOrder() callback:",
    cart
  );

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
    console.error("Failed to generate Access Token:", error);
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
      // Uncomment one of these to force an error for negative testing (in sandbox mode only). Documentation:
      // https://developer.paypal.com/tools/sandbox/negative-testing/request-headers/
      // "PayPal-Mock-Response": '{"mock_application_codes": "INSTRUMENT_DECLINED"}'
      // "PayPal-Mock-Response": '{"mock_application_codes": "TRANSACTION_REFUSED"}'
      // "PayPal-Mock-Response": '{"mock_application_codes": "INTERNAL_SERVER_ERROR"}'
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
            console.error("Failed to create order:", error);
            res.status(500).json({ error: "Failed to create order." });
          }
        })
        .catch((err) => res.status(400).json({ err }));
    })
    .catch((err) => res.status(403).json({ err }));
};

exports.ordersCapture = async (req, res, next) => {
  console.log("ok capture");
  try {
    const { orderID } = req.params;
    const { jsonResponse, httpStatusCode } = await captureOrder(orderID);
    console.log(
      jsonResponse.purchase_units[0].payments.captures[0].amount.value
    );
    if (httpStatusCode === 201) {
      User.findOne({ _id: req.auth.userId })
        .then(async (user) => {
          console.log(user);
          const totalCart =
            parseInt(
              jsonResponse.purchase_units[0].payments.captures[0].amount.value
            ) * 100;
          console.log(totalCart);
          const { deliveryInfo, commandeInfo } = req.body;
          const newOrder = new Orders({
            userName: user.name,
            userSurname: user.surname,
            userEmail: user.email,
            phone: commandeInfo.phone,

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
          Promise.all([
            newOrder.save(),
            Stone.find({ _id: { $in: user.cart } }).then(async (stone) => {
              const promises = [];
              for (let index = 0; index < stone.length; index++) {
                promises.push(
                  awsDeleteConfig(stone[index].mainFile, stone[index].file)
                );
              }
              await Promise.all(promises);

              console.log("supprimé AWS");
              console.log(user.cart);
              await Stone.deleteMany({ _id: { $in: user.cart } });
              await User.findOneAndUpdate(
                { _id: req.auth.userId },
                { $set: { cart: [] } }
              );
            }),
          ])
            .then(async () => {
              res.status(httpStatusCode).json(jsonResponse);
            })
            .catch((error) => res.status(400).json({ error: "save" }));
        })
        .catch((err) => res.status(400).json({ err }));
    }
  } catch (error) {
    console.error("Failed to create order:", error);
    res.status(500).json({ error: "Failed to capture order." });
  }
};
