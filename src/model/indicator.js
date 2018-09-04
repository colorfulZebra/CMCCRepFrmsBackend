'use strict';
const mongoose = require('../db');
const Schema = mongoose.Schema;

let indicatorSchema = new Schema({
  name: String,
  rules: String
});

indicatorSchema.index({ 'name': 1 }, { unique: true });

module.exports = mongoose.model('indicator', indicatorSchema);