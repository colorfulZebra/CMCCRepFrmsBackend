'use strict';
const express = require('express');
const router = express.Router();
const Row = require('../controller/row');

router.get('/query', function(req, res) {
  Row.queryRow().then((docs) => {
    res.send({
      result: true,
      data: docs
    });
  }).catch((err) => {
    console.log(err);
    res.send({
      result: false,
      data: err
    });
  });
});

router.post('/new', function(req, res) {
  let type = req.body.type;
  let name = req.body.name;
  Row.newRow(type, name).then((doc) => {
    res.send({
      result: true,
      data: doc
    });
  }).catch((err) => {
    console.log(err);
    res.send({
      result: false,
      data: err
    });
  });
});

router.delete('/delete', function(req, res) {
  let type = req.body.type;
  let name = req.body.name;
  Row.deleteRow(type, name).then((doc) => {
    res.send({
      result: true,
      data: doc
    });
  }).catch((err) => {
    console.log(err);
    res.send({
      result: false,
      data: err
    });
  });
});

module.exports = router;
