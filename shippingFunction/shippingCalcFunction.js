const { shippingFunctionCM } = require("./shippingFunctionCM");
const { shippingFunctionMR } = require("./shippingFunctionMR");

exports.shippingCalcFunction = (data, deliveryCompany, deliveryCountry) => {
  let totalcart = data.reduce((total, produit) => total + produit.price, 0);

  if (totalcart < 8000) {
    if (deliveryCompany === "MR") {
      if (deliveryCountry) {
        const shippingPrice = shippingFunctionMR(data, deliveryCountry);
        totalcart = parseInt(totalcart) + parseInt(shippingPrice);
      } else {
        res.status(400).json({ message: "pays invalide" });
      }
    } else if (deliveryCompany === "CM") {
      if (deliveryCountry) {
        const shippingPrice = shippingFunctionCM(data, deliveryCountry);
        totalcart = parseInt(totalcart) + parseInt(shippingPrice);
      } else {
        res.status(400).json({ message: "pays invalide" });
      }
    } else {
      res.status(400).json({ message: "mode de livraison invalide" });
    }
  }
  return totalcart;
};
