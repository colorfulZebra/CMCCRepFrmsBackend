'use strict';
const express = require('express');
const router = express.Router();
const Indicator = require('../controller/indicator');

router.get('/query', function(req, res) {
  Indicator.allIndicators().then((docs) => {
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
  let rule = req.body.rule;
  Indicator.newIndicator(type, name, rule).then((doc) => {
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
  Indicator.deleteIndicator(type, name).then((doc) => {
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

router.get('/calculate', function(req, res) {
  let type = req.query.type;
  let name = req.query.name;
  let month = req.query.month;
  let rowname = req.query.rowname;
  Indicator.calIndicator(type, name, month, rowname).then((doc) => {
    res.send({
      data: doc,
      result: true
    });
  }).catch((err) => {
    console.log(err);
    res.send({
      data: err,
      result: false
    });
  });
});

router.get('/extend', function(req, res) {
  let name = req.query.name;
  let month = req.query.month;
  Indicator.extendOnly(name, month).then((data) => {
    res.send({
      data,
      result: true
    });
  }).catch((err) => {
    console.log(err);
    res.send({
      data: err,
      result: false
    });
  });
});

module.exports = router;
