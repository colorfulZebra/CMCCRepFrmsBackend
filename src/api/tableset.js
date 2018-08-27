'use strict';
const express = require('express');
let router = express.Router();
let TableSet = require('../controller/tableset');

router.post('/new/set', function(req, res) {
  let username = req.body.owner;
  let setname = req.body.name;
  TableSet.newSet(username, setname).then((doc) => {
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

module.exports = router;
