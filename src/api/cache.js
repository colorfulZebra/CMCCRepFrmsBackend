'use strict';
const express = require('express');
const router = express.Router();
const Cache = require('../controller/cache');

router.post('/set', function(req, res) {
  let name = req.body.name;
  let month = req.body.month;
  let value = req.body.value;
  Cache.cache(name, month, value).then((doc) => {
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
  Cache.getCache(name, month).then((doc) => {
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
