'use strict';
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const config = require('./config');

const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use('/download', express.static('download'));
app.use('/api/user', require('./api/user'));
app.use('/api/excel', require('./api/excel'));
app.use('/api/repfrm', require('./api/tableset'));
app.use('/api/pixel', require('./api/tablepixel'));
app.use('/api/indicator', require('./api/indicator'));
app.use('/api/cache', require('./api/cache'));
app.use('/api/rowtype', require('./api/row'));

app.use(express.static('dist'));
let server = app.listen(config.port, function () {

  let serverPort = server.address().port;
  console.log(`App listening on port ${serverPort}`);
});
