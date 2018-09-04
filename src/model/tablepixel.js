'use strict';
const mongoose = require('../db');
const Schema = mongoose.Schema;

let tablePixelSchema = new Schema({
  name: String,
  excel: String,
  sheet: String,
  keywords: String,
  rowindex: Number
});

tablePixelSchema.index({ 'name': 1 }, { unique: true });

module.exports = mongoose.model('TablePixel', tablePixelSchema);