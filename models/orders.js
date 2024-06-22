const mongoose = require("mongoose");
const { version } = require("os");

const ordersSchema = mongoose.Schema(
  {
    userName: { type: String, required: true },
    userSurname: { type: String, required: true },
    userEmail: { type: String, required: true },
    phone: { type: String, required: true },

    orderID: { type: String, required: true },
    total: { type: Number, required: true },

    deliveryName: { type: String, required: false },
    deliverySurname: { type: String, required: true },
    deliveryCompany: { type: String, required: true },
    deliveryShopName: { type: String, required: false },
    deliveryRoad: { type: String, required: true },
    deliveryCP: { type: String, required: true },
    deliveryCity: { type: String, required: true },
    deliveryCountry: { type: String, required: true },
  },
  { versionKey: false }
);

module.exports = mongoose.model("Orders", ordersSchema);
