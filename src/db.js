'use strict';
const mongoose = require('mongoose');
const config = require('./config');
const DB_URL = `mongodb://${config.dbhost}:${config.dbport}/${config.dbname}`;

mongoose.connect(DB_URL, { useNewUrlParser: true });

mongoose.connection.on('connected', function() {
  console.log('Mongoose connection open to ' + DB_URL);
});

mongoose.connection.on('error', function(err) {
  console.log('Mongoose connection error ' + err);
});

mongoose.connection.on('disconnected', function() {
  console.log('Mongoose connection closed');
});

module.exports = mongoose;
