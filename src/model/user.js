'use strict';
const mongoose = require('../db');
let Schema = mongoose.Schema;

let userSchema = new Schema({
  name: String,
  password: String
});
userSchema.index({ 'name': 1 }, { unique: true });

module.exports = mongoose.model('User', userSchema);
