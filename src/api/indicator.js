'use strict';
const express = require('express');
let router = express.Router();
let Indicator = require('../controller/indicator');

router.get('/query', function(req, res) {
  Indicator.allIndicators().then((docs) => {
    res.send({
      result: true,
      data: docs
    });
  }).catch((err) => {
    res.send({
      result: false,
      data: err
    });
  });
});

router.post('/new', function(req, res) {
  let name = req.body.name;
  let rule = req.body.rule;
  Indicator.newIndicator(name, rule).then((doc) => {
    res.send({
      result: true,
      data: doc
    });
  }).catch((err) => {
    res.send({
      result: false,
      data: err
    });
  });
});

router.delete('/delete', function(req, res) {
  let name = req.body.name;
  Indicator.deleteIndicator(name).then((res) => {
    res.send({
      result: true,
      data: res
    });
  }).catch((err) => {
    res.send({
      result: false,
      data: err
    });
  });
});

module.exports = router;
