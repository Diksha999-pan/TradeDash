const mongoose = require('mongoose');

const {PositionsSchema }= require('../schemas/PositionsSchema');

const PositionModel = mongoose.model("Position", PositionsSchema);

module.exports = {PositionModel};