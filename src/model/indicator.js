'use strict';
const mongoose = require('../db');
const Schema = mongoose.Schema;

let indicatorSchema = new Schema({
  name: String,
  rule: String
});

indicatorSchema.index({ 'name': 1 }, { unique: true });

module.exports = mongoose.model('Indicator', indicatorSchema);
