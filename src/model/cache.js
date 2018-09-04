'use strict';
const mongoose = require('../db');
const Schema = mongoose.Schema;

let cacheSchema = new Schema({
  name: String,
  month: String,
  cachedate: Date,
  value: {
    row: Number,
    col: Number,
    val: String
  }
});

module.exports = mongoose.model('Cache', cacheSchema);
