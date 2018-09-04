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
    console.log(err);
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

router.delete('/delete', function(req, res) {
  let name = req.body.name;
  TablePixel.deletePixel(name).then((doc) => {
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

router.get('/value', function(req, res) {
  let month = req.query.month;
  let name = req.query.name;
  let rowname = req.query.rowname;
  TablePixel.getPixelValue(name, month, rowname).then((doc) => {
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
