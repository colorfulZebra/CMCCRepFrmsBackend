'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const config = require('./config');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', function (req, res) {

  res.send('Hello world');
});

app.use('/api/user', require('./api/user'));
app.use('/api/excel', require('./api/excel'));
app.use('/api/repfrm', require('./api/tableset'));

let server = app.listen(config.port, function () {

  let serverPort = server.address().port;
  console.log(`App listening on port ${serverPort}`);
});
