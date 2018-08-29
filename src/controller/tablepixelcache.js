'use strict';
const scriptPath = 'controller/tablepixelcache.js';
const regMonth = /\d{6}/;
const moment = require('moment');
let TablePixelCache = require('../model/tablepixelcache');

moment.locale('zh-cn');

module.exports = {

  /**
   * Cache pixel value in mongodb
   * @param {String} name
   * @param {String} excel
   * @param {String} sheet
   * @param {String} month
   * @param {String} value
   */
  cache: function(name, excel, sheet, month, value) {
    return new Promise((resolve, reject) => {
      if (typeof name === 'string' && typeof excel === 'string' && typeof sheet === 'string'
      && typeof month === 'string' && regMonth.test(month)
      && typeof value === 'string') {
        new TablePixelCache({
          name,
          excel,
          sheet,
          month,
          // cachedate: moment().format('YYYY-MM-DD HH:mm:ss.SS'),
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
        reject(`${scriptPath}: cache(name, excel, sheet, month, value) 参数非法`);
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
  getCache: function(name, excel, sheet, month) {
    return new Promise((resolve, reject) => {
      if (typeof name === 'string' && typeof excel === 'string' && typeof sheet === 'string'
      && typeof month === 'string' && regMonth.test(month)) {
        TablePixelCache.find({ name, excel, sheet, month }).sort({ cachedate: -1 }).limit(1).exec().then((doc) => {
          resolve(doc);
        }).catch((err) => {
          reject(err);
        });
      } else {
        reject(`${scriptPath}: getCache(name, excel, sheet, month) 参数非法`);
      }
    });
  }

};
