const jwt = require("jsonwebtoken");

// MIDDLEWARE D'AUTENTIFICATION //

module.exports = (req, res, next) => {
  console.log("cookie", req.headers.Cookie);

  try {
    const token = req.cookies.userToken || req.headers.cookie;
    console.log(token);

    const decodedToken = jwt.verify(token, process.env.BCRYPTCRYPTAGE);

    const userId = decodedToken.userId;
    req.auth = {
      userId: userId,
    };
    next();
  } catch (error) {
    res.status(401).json({ message: "token expiré" });
  }
};
