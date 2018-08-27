'use strict';
const express = require('express');
let router = express.Router();
let User = require('../controller/user');

// 根据用户名取得用户信息
router.get('/query/:name', function(req, res) {
  User.findByName(req.params.name).then((userGet) => {
    res.send({ result: true, data: userGet });
  }).catch((err) => {
    console.log(err);
    res.send({
      result: false,
      data: err
    });
  });
});

// 登录
router.post('/login', function(req, res) {
  let userInfo = { name: req.body.name, password: req.body.password };
  User.checkIn(userInfo).then((userCin) => {
    if (userCin) {
      res.send({ result: true });
    } else {
      res.send({ result: false });
    }
  }).catch((err) => {
    console.log(err);
    res.send({
      result: false,
      data: err
    });
  });
});

// 根据POST内容新增用户
router.post('/new', function(req, res) {
  let newUser = { name: req.body.name, password: req.body.password };
  User.insert(newUser).then((userRes) => {
    res.send({ result: true, data: userRes });
  }).catch((err) => {
    console.log(err);
    res.send({
      result: false,
      data: err
    });
  });
});

module.exports = router;
