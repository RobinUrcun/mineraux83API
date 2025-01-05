const { shippingFunctionCM } = require("./shippingFunctionCM");
const { shippingFunctionMR } = require("./shippingFunctionMR");

exports.shippingCalcFunction = (data, deliveryCompany, deliveryCountry) => {
  let totalcart = data.reduce((total, produit) => total + produit.price, 0);

  if (totalcart < 6000) {
    if (deliveryCompany === "MR") {
      if (deliveryCountry) {
        const shippingPrice = shippingFunctionMR(data, deliveryCountry);
        totalcart = parseInt(totalcart) + parseInt(shippingPrice);
      } else {
        res.status(400).json({ message: "pays invalide" });
      }
    } else if (deliveryCompany === "CP") {
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
  console.log(totalcart);

  return totalcart;
};
