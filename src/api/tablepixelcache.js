'use strict';
const express = require('express');
let router = express.Router();
let TablePixelCache = require('../controller/tablepixelcache');

router.post('/cache', function(req, res) {
  let name = req.body.name;
  let excel = req.body.excel;
  let sheet = req.body.sheet;
  let month = req.body.month;
  let value = req.body.value;
  TablePixelCache.cache(name, excel, sheet, month, value).then((doc) => {
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

router.get('/get', function(req, res) {
  let month = req.query.month;
  let excel = req.query.excel;
  let sheet = req.query.sheet;
  let name = req.query.name;
  TablePixelCache.getCache(name, excel, sheet, month).then((doc) => {
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
