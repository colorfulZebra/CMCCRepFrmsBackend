'use strict';
const express = require('express');
let router = express.Router();
let TablePixelCache = require('../controller/tablepixelcache');

router.post('/set', function(req, res) {
  let name = req.body.name;
  let month = req.body.month;
  let value = req.body.value;
  TablePixelCache.cache(name, month, value).then((doc) => {
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
  let name = req.query.name;
  TablePixelCache.getCache(name, month).then((doc) => {
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
