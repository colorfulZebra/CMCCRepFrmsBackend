'use strict';
const mongoose = require('../db');
const Schema = mongoose.Schema;

let indicatorSchema = new Schema({
  type: String,
  name: String,
  rule: String
});

indicatorSchema.index({ 'type': 1, 'name': 1 }, { unique: true });

module.exports = mongoose.model('Indicator', indicatorSchema);
