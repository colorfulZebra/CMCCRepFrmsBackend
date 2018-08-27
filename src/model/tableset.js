'use strict';
const mongoose = require('../db');
const Schema = mongoose.Schema;

let tablesetSchema = new Schema({
  owner: String,
  name: String,
  tables: [
    {
      name: String,
      columns: [ String ],
      rows: [ String ],
      observer: [ String ]
    }
  ]
});

module.exports = mongoose.model('TableSet', tablesetSchema);
