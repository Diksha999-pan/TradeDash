const { model } = require("mongoose");
const {HoldingsSchema} = require("../schemas/HoldingsSchema");

const HoldingModel = model("Holding", HoldingsSchema);

module.exports = HoldingModel;

