// filepath: CarShopBackend/models/Car.js
const mongoose = require('mongoose');

const carSchema = new mongoose.Schema({
  make: { type: String, required: true },
  model: { type: String, required: true },
  year: { type: Number, required: true },
  keywords: { type: String },
  description: { type: String },
  fuelType: { type: String, required: true },
  price: { type: Number, required: true },
  img: { type: String },
});

module.exports = mongoose.model('Car', carSchema);