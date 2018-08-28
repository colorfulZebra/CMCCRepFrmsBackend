'use strict';
const mongoose = require('../db');
let Schema = mongoose.Schema;

let excelSchema = new Schema({
  month: String,
  excel: String,
  sheet: String,
  content: [ [String] ]
});
excelSchema.index({ month: 1, excel: 1, sheet: 1 }, { unique: true });

module.exports = mongoose.model('Excel', excelSchema);