'use strict';
const mongoose = require('../db');
const Schema = mongoose.Schema;

let tablesetSchema = new Schema({
  owner: String,
  name: String,
  tables: [
    {
      name: String,
      columns: [{
        label: String,
        name: String,
        ctype: String,
        month: String
      }],
      rows: [ String ],
      observer: [ String ]
    }
  ]
});
tablesetSchema.index({ 'owner': 1, 'name': 1 }, { unique: true });

module.exports = mongoose.model('TableSet', tablesetSchema);
