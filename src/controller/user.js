'use strict';
const md5 = require('md5');
let User = require('../model/user');
const scriptPath = 'controller/user.js';

module.exports = {
  insert: function(newUser) {
    return new Promise((resolve, reject) => {
      if (newUser.name && newUser.password && typeof newUser.name === 'string' && typeof newUser.password === 'string') {
        this.findByName(newUser.name).then((userGet) => {
          if (userGet) {    // 如果用户已经存在则报错
            reject(`${scriptPath}: insert() 用户${newUser.name}已存在`);
          } else {
            let newRecord = new User({
              name: newUser.name,
              password: md5(newUser.password)
            });
            newRecord.save( (err, res) => {
              if (err) {
                reject(err);
              } else {
                resolve(res);
              }
            });
          }
        }).catch((err) => {
          reject(err);
        });
      } else {
        reject('controller/user.js: insert() 用户名或密码非法');
      }
    });
  },

  findByName: function(name) {
    return new Promise((resolve, reject) => {
      if (typeof name === 'string') {
        User.findOne({ name }, (err, res) => {
          if (err) {
            reject(err);
          } else {
            resolve(res);
          }
        });
      } else {
        reject(`${scriptPath}: findByName() 非法用户名`);
      }
    });
  },

  checkIn: function(userInfo) {
    return new Promise((resolve, reject) => {
      if (userInfo.name && userInfo.password && typeof userInfo.name === 'string' && typeof userInfo.password === 'string') {
        User.findOne({ name: userInfo.name, password: md5(userInfo.password) }, (err, res) => {
          if (err) {
            reject(err);
          } else {
            resolve(res);
          }
        });
      } else {
        reject(`${scriptPath}: checkIn() 用户名或密码非法`);
      }
    });
  }
};
