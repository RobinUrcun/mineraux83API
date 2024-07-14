const mr_france_priceliste = require("../priceList/mondialRelay/france/mr_france_priceliste.json");
const mr_belgique_priceList = require("../priceList/mondialRelay/belgique/mr_belgique_priceList.json");
const mr_luxembourg_priceList = require("../priceList/mondialRelay/luxembourg/mr_luxembourg_priceList.json");
const mr_paysBas_priceList = require("../priceList/mondialRelay/pays-bas/mr_pays-bas_priceList.json");
const mr_espagne_priceList = require("../priceList/mondialRelay/espagne/mr_espagne_priceList.json");
const mr_portugal_priceList = require("../priceList/mondialRelay/portugal/mr_portugal_priceList.json");
exports.shippingFunctionMR = (cartList, countryToSend) => {
  const priceLists = {
    FR: mr_france_priceliste,
    BE: mr_belgique_priceList,
    LU: mr_luxembourg_priceList,
    NL: mr_paysBas_priceList,
    ES: mr_espagne_priceList,
    PT: mr_portugal_priceList,
  };
  let totalWeight = 0;

  for (let i = 0; i < cartList.length; i++) {
    const newTotalWeight = totalWeight + cartList[i].weight;
    totalWeight = newTotalWeight;
  }
  const selectedCountry = priceLists[countryToSend];
  const tranche = selectedCountry.tarif.find(
    (tranche) => totalWeight <= tranche.maxWeight
  );

  return tranche.price;
};
