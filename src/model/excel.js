'use strict';
const mongoose = require('../db');
let Schema = mongoose.Schema;

let excelSchema = new Schema({
  month: String,
  excel: String,
  sheet: String,
  content: [ [String] ]
});

module.exports = mongoose.model('Excel', excelSchema);