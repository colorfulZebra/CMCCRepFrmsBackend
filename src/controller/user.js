'use strict';
const md5 = require('md5');
const User = require('../model/user');
const scriptPath = 'controller/user.js';

module.exports = {
  /**
   * add new user
   * @param {Object} newUser
   * @return {Promise}
   */
  insert: function(newUser) {
    return new Promise((resolve, reject) => {
      if (newUser.name && newUser.password && typeof newUser.name === 'string' && typeof newUser.password === 'string') {
        new User({
          name: newUser.name,
          password: md5(newUser.password)
        }).save((err, doc) => {
          if (err) {
            reject(err);
          } else {
            resolve(doc);
          }
        });
      } else {
        reject('controller/user.js: insert(newUser) 用户名或密码非法');
      }
    });
  },

  /**
   * query user in database by name
   * @param {string} name
   * @return {Promise}
   */
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
        reject(`${scriptPath}: findByName(name) 非法用户名`);
      }
    });
  },

  /**
   * check username and password then authentication
   * @param {Object} userInfo
   * @return {Promise}
   */
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
        reject(`${scriptPath}: checkIn(userInfo) 用户名或密码非法`);
      }
    });
  }
};
