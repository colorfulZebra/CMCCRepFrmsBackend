'use strict';
const express = require('express');
const router = express.Router();
const TableSet = require('../controller/tableset');

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
router.post('/set/new', function(req, res) {
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

router.delete('/set/delete', function(req, res) {
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

router.put('/set/rename', function(req, res) {
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
router.put('/table/new', function(req, res) {
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

router.delete('/table/delete', function(req, res) {
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

router.get('/table/gen', function(req, res) {
  let username = req.query.owner;
  let setname = req.query.name;
  let tablename = req.query.table;
  TableSet.genTable(username, setname, tablename).then((doc) => {
    res.send({
      result: true,
      data: doc
    });
  }).catch(err => {
    console.log(err);
    res.send({
      result: false,
      data: err
    });
  });
});

router.post('/table/genall', function(req, res) {
  let username = req.body.owner;
  let tablelist = req.body.tables;
  TableSet.genTables(username, tablelist).then(docs => {
    res.send({
      result: true,
      data: docs
    });
  }).catch(err => {
    console.log(err);
    res.send({
      result: false,
      data: err
    });
  });
});

router.get('/table/download', function(req, res) {
  let username = req.query.owner;
  let setname = req.query.name;
  let tablename = req.query.table;
  TableSet.genTable(username, setname, tablename).then(doc => {
    return TableSet.genXLSX(username, doc.setname, doc.data);
  }).then(file => {
    res.send({
      result: true,
      data: file
    });
  }).catch(err => {
    console.log(err);
    res.send({
      result: false,
      data: err
    });
  });
});

router.post('/table/downloadall', function(req, res) {
  let username = req.body.owner;
  let tablelist = req.body.tables;
  TableSet.genTables(username, tablelist).then(docs => {
    return TableSet.genXLSXs(username, docs);
  }).then(file => {
    res.send({
      result: true,
      data: file
    });
  }).catch(err => {
    console.log(err);
    res.send({
      result: false,
      data: err
    });
  });
});

router.put('/table/rename', function(req, res) {
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
