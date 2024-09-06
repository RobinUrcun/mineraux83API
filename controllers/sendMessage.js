const nodemailer = require("nodemailer");

exports.sendMessage = (req, res, next) => {
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.NODEMAILER_USER,
      pass: process.env.NODEMAILER_PASSWORD,
    },
  });
  const mailOptions = {
    from: "mineraux83API@gmail.com",
    to: "moragerard@hotmail.fr",
    subject: `New message from ${req.body.name} ${req.body.phone}`,
    text: `De : ${req.body.name}, mail: ${req.body.mail}, téléphone: ${req.body.phone}, message :${req.body.message}`,
  };
  transporter
    .sendMail(mailOptions)
    .then((response) => {
      res.status(200).json({ message: "ok" });
    })
    .catch((err) => {
      res.status(400).json({ err });
    });
};
