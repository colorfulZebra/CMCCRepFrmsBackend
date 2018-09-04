'use strict';
const scriptPath = 'controller/tablepixelcache.js';
const regMonth = /\d{6}/;
let TablePixelCache = require('../model/tablepixelcache');

module.exports = {

  /**
   * Cache pixel value in mongodb
   * @param {String} name
   * @param {String} excel
   * @param {String} sheet
   * @param {String} month
   * @param {String} value
   */
  cache: function(name, month, value) {
    return new Promise((resolve, reject) => {
      if (typeof name === 'string'
      && typeof month === 'string' && regMonth.test(month)
      && value !== undefined
      && value.row !== undefined && typeof value.row === 'number'
      && value.col !== undefined && typeof value.col === 'number'
      && value.val !== undefined && typeof value.val === 'string') {
        new TablePixelCache({
          name,
          month,
          cachedate: new Date(),
          value
        }).save((err, doc) => {
          if (err) {
            reject(err);
          } else {
            resolve(doc);
          }
        });
      } else {
        reject(`${scriptPath}: cache(name, month, value) 参数非法`);
      }
    });
  },

  /**
   * Get cached value of pixel in mongodb
   * @param {String} name
   * @param {String} excel
   * @param {String} sheet
   * @param {String} month
   */
  getCache: function(name, month) {
    return new Promise((resolve, reject) => {
      if (typeof name === 'string'
      && typeof month === 'string' && regMonth.test(month)) {
        TablePixelCache.find({ name, month }).sort({ cachedate: -1 }).limit(1).exec().then((doc) => {
          resolve(doc);
        }).catch((err) => {
          reject(err);
        });
      } else {
        reject(`${scriptPath}: getCache(name, month) 参数非法`);
      }
    });
  }

};