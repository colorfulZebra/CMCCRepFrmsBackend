'use strict';
const scriptPath = 'controller/tablepixel.js';
const regMonth = /\d{6}/;
const Excel = require('./excel');
const TablePixel = require('../model/tablepixel');
const Cache = require('./cache');

module.exports = {

  /**
   * Add a new pixel
   * @param {string} name
   * @param {string} excel
   * @param {string} sheet
   * @param {string} keywords
   * @param {number} rowindex
   */
  newPixel: function(name, excel, sheet, keywords, rowindex) {
    return new Promise((resolve, reject) => {
      if (typeof name === 'string'
      && typeof excel === 'string'
      && typeof sheet === 'string'
      && typeof keywords === 'string'
      && typeof rowindex === 'number') {
        new TablePixel({
          name,
          excel,
          sheet,
          keywords,
          rowindex
        }).save((err, doc) => {
          if (err) {
            reject(err);
          } else {
            resolve(doc);
          }
        });
      } else {
        reject(`${scriptPath}: newPixel(name, excel, sheet, keywords, rowindex) 参数非法`);
      }
    });
  },

  /**
   * Delete pixel specified
   * @param {string} name
   * @param {string} excel
   * @param {string} sheet
   */
  deletePixel: function(name) {
    return new Promise((resolve, reject) => {
      if (typeof name ==='string') {
        TablePixel.findOneAndRemove({
          name
        }, (err, doc) => {
          if (err) {
            reject(err);
          } else {
            resolve(doc);
          }
        });
      } else {
        reject(`${scriptPath}: deletePixel(name) 参数非法`);
      }
    });
  },

  /**
   * Return all pixels
   */
  allPixels: function() {
    return new Promise((resolve, reject) => {
      TablePixel.find({}, (err, docs) => {
        if (err) {
          reject(err);
        } else {
          resolve(docs);
        }
      });
    });
  },

  /**
   * Calculate pixel value
   * @param {string} month
   * @param {string} excel
   * @param {string} sheet
   * @param {string} name
   * @param {string} rowname
   * @param {boolean} cacheFlag
   */
  getPixelValue: function(name, month, rowname) {
    return new Promise((resolve, reject) => {
      if (typeof name === 'string'
      && typeof rowname === 'string'
      && typeof month === 'string' && regMonth.test(month)) {
        Cache.getCache(`pixel_${name}_${rowname}`, month).then((doc) => {
          if (doc.length === 1 && doc[0].value !== undefined) {
            resolve(doc[0].value);
          } else {
            TablePixel.findOne({ name }, (err, doc) => {
              if (err) {
                reject(err);
              } else if (!doc) {
                reject(`${scriptPath}: getPixelValue(name, month, rowname) 无法找到对应指标'${name}'`);
              } else {
                let keywords = doc.keywords.split(' ');
                keywords.splice(doc.rowindex, 0, rowname);
                Excel.cell(month, doc.excel, doc.sheet, keywords.join(' ')).then((data) => {
                  Cache.cache(`pixel_${name}_${rowname}`, month, data).then(() => {
                    resolve(data);
                  }).catch((err) => {
                    reject(err);
                  });
                }).catch((err) => {
                  reject(err);
                });
              }
            });
          }
        }).catch((err) => {
          reject(err);
        });
      } else {
        reject(`${scriptPath}: getPixelValue(name, month, rowname) 参数非法`);
      }
    });
  },

};
