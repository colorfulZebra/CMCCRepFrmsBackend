'use strict';
const md5 = require('md5');
const moment = require('moment');
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
          password: md5(newUser.password),
          expire: moment().add(3,'month').format()
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
            let nowd = moment();
            if (nowd.isBefore(moment(res.expire))) {
              resolve(res);
            } else {
              reject('用户授权过期，请联系管理员重新授权');
            }
          }
        });
      } else {
        reject(`${scriptPath}: checkIn(userInfo) 用户名或密码非法`);
      }
    });
  },

  changePWD: function(account, password, newpassword) {
    return new Promise((resolve, reject) => {
      if (typeof account === 'string' && account.length > 0 &&
          typeof password === 'string' && password.length > 0 &&
          typeof newpassword === 'string' && newpassword.length > 0) {
        User.findOne({ name: account, password: md5(password) }, (err, doc) => {
          if (err) {
            reject(err);
          } else if (!doc) {
            reject(`${scriptPath}: changePWD(account, password, newpassword) 用户名或密码错误`);
          } else {
            User.findOneAndUpdate({ name: account }, { $set: { password: md5(newpassword) } }, (err, res) => {
              if (err) {
                reject(err);
              } else {
                resolve(res);
              }
            });
          }
        });
      } else {
        reject(`${scriptPath}: changePWD(account, newpassword) 用户名或密码非法`);
      }
    });
  },

  authorise: function(account) {
    return new Promise((resolve, reject) => {
      if (typeof account === 'string' && account.length > 0) {
        User.findOne({ name: account }, (err, doc) => {
          if (err) {
            reject(err);
          } else {
            let expiredate = moment(doc.expire);
            User.findOneAndUpdate({ name: account }, { $set: {
              expire: expiredate.add(3,'month').format()
            }}, (err, doc) => {
              if (err) {
                reject(err);
              } else {
                resolve(doc);
              }
            });
          }
        });
      } else {
        reject(`${scriptPath}: authorise(account) 参数非法`);
      }
    });
  }
};
