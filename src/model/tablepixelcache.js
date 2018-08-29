'use strict';
const mongoose = require('../db');
const Schema = mongoose.Schema;

let tablePixelCacheSchema = new Schema({
  name: String,
  excel: String,
  sheet: String,
  month: String,
  cachedate: Date,
  value: String
});

module.exports = mongoose.model('TablePixelCache', tablePixelCacheSchema);