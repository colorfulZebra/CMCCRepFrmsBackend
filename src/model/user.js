'use strict';
const mongoose = require('../db');
let Schema = mongoose.Schema;

let userSchema = new Schema({
  name: String,
  password: String
});

module.exports = mongoose.model('User', userSchema);
