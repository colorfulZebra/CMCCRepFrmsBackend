'use strict';
const express = require('express');
const router = express.Router();
const Excel = require('../controller/excel');

router.get('/fuzzy/query', function(req, res) {
  let month = req.query.month;
  let excel = req.query.excel;
  let sheet = req.query.sheet;
  Excel.fuzzyQueryExcel(month, excel, sheet).then((doc) => {
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

router.post('/record/excel', function(req, res) {
  let excelPath = req.body.excel;
  let monthID = req.body.monthID;
  Excel.recordExcel(excelPath, monthID).then((docs) => {
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

router.post('/record/folder', function(req, res) {
  let folderPath = req.body.folder;
  let monthID = req.body.monthID;
  Excel.recordExcelsOfFolder(folderPath, monthID).then((docs) => {
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

module.exports = router;
