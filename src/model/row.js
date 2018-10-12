'use strict';
const mongoose = require('../db');
const Schema = mongoose.Schema;

let rowTypeSchema = new Schema({
  type: String,
  name: String
});

rowTypeSchema.index({ 'type': 1, 'name': 1 }, { unique: true });

module.exports = mongoose.model('RowType', rowTypeSchema);
