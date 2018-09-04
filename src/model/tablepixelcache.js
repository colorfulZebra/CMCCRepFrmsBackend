'use strict';
const mongoose = require('../db');
const Schema = mongoose.Schema;

let tablePixelCacheSchema = new Schema({
  name: String,
  month: String,
  cachedate: Date,
  value: {
    row: Number,
    col: Number,
    val: String
  }
});

module.exports = mongoose.model('TablePixelCache', tablePixelCacheSchema);
