'use strict';
const express = require('express');
let router = express.Router();
let TableSet = require('../controller/tableset');

router.get('/query/:username', function(req, res) {
  TableSet.findTablesByUser(req.params.username).then((doc) => {
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


/***************************** REST api for tablesets ***************************/
router.post('/new/set', function(req, res) {
  let username = req.body.owner;
  let setname = req.body.name;
  TableSet.newSet(username, setname).then((doc) => {
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

router.delete('/delete/set', function(req, res) {
  let username = req.body.owner;
  let setname = req.body.name;
  TableSet.deleteSet(username, setname).then((doc) => {
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

router.put('/rename/set', function(req, res) {
  let username = req.body.owner;
  let setname = req.body.name;
  let newname = req.body.newname;
  TableSet.renameSet(username, setname, newname).then((doc) => {
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


/***************************** REST api for tables ***************************/
router.put('/new/table', function(req, res) {
  let username = req.body.owner;
  let setname = req.body.name;
  let table  = req.body.table;
  TableSet.newTable(username, setname, table).then((doc) => {
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

router.delete('/delete/table', function(req, res) {
  let username = req.body.owner;
  let setname = req.body.name;
  let tablename = req.body.table;
  TableSet.deleteTable(username, setname, tablename).then((doc) => {
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

router.put('/rename/table', function(req, res) {
  let username = req.body.owner;
  let setname = req.body.name;
  let tablename = req.body.table;
  let newname = req.body.newname;
  TableSet.renameTable(username, setname, tablename, newname).then((doc) => {
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