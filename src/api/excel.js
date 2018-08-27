'use strict';
const express = require('express');
let router = express.Router();
let Excel = require('../controller/excel');

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
