'use strict';
const scriptPath = 'controller/tablepixel.js';
const regMonth = /\d{6}/;
let Excel = require('./excel');
let TablePixel = require('../model/tablepixel');
let TablePixelCache = require('./tablepixelcache');

module.exports = {

  /**
   * Add a new pixel
   * @param {String} name
   * @param {String} excel
   * @param {String} sheet
   * @param {String} keywords
   * @param {Number} rowindex
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
   * @param {String} name
   * @param {String} excel
   * @param {String} sheet
   */
  deletePixel: function(name, excel, sheet) {
    return new Promise((resolve, reject) => {
      if (typeof name ==='string'
      && typeof excel === 'string'
      && typeof sheet === 'string') {
        TablePixel.findOneAndRemove({
          name,
          excel,
          sheet
        }, (err, doc) => {
          if (err) {
            reject(err);
          } else {
            resolve(doc);
          }
        });
      } else {
        reject(`${scriptPath}: deletePixel(name, excel, sheet) 参数非法`);
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
   * @param {String} month
   * @param {String} excel
   * @param {String} sheet
   * @param {String} name
   * @param {String} rowname
   * @param {Boolean} cacheFlag
   */
  getPixelValue: function(month, excel, sheet, name, rowname, cacheFlag) {
    return new Promise((resolve, reject) => {
      if (typeof name === 'string'
      && typeof excel === 'string'
      && typeof sheet === 'string'
      && typeof rowname === 'string'
      && typeof month === 'string' && regMonth.test(month)
      && typeof cacheFlag === 'boolean') {
        TablePixelCache.getCache(`${name}_${rowname}`, excel, sheet, month).then((doc) => {
          if (doc && doc.row !== undefined && doc.col !== undefined && doc.val !== undefined) {
            resolve(doc);
          } else {
            TablePixel.findOne({ name, excel, sheet }, (err, doc) => {
              if (err) {
                reject(err);
              } else if (!doc) {
                reject(`${scriptPath}: getPixelValue(month, excel, sheet, name, rowname, cacheFlag) 找不到指标'${excel}/${sheet}/${name}'`);
              } else {
                let keywords = doc.keywords.split(' ');
                keywords.splice(doc.rowindex, 0, rowname);
                Excel.cell(month, excel, sheet, keywords.join(' ')).then((data) => {
                  resolve(data);
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
        reject(`${scriptPath}: getPixelValue(month, excel, sheet, name, rowname, cacheFlag) 参数非法`);
      }
    });
  },

};
