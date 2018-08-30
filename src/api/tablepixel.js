'use strict';
const express = require('express');
let router = express.Router();
let TablePixel = require('../controller/tablepixel');

router.get('/query', function(req, res) {
  TablePixel.allPixels().then((docs) => {
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
  let excel = req.body.excel;
  let sheet = req.body.sheet;
  let keywords = req.body.keywords;
  let rowindex = req.body.rowindex;
  TablePixel.newPixel(name, excel, sheet, keywords, rowindex).then((doc) => {
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
