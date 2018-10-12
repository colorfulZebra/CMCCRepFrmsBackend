'use strict';
const scriptPath = 'controller/row.js';
const RowType = require('../model/row');

module.exports = {

  /**
   * 
   * @param {string} type 
   * @param {string} name 
   */
  newRow: function(type, name) {
    return new Promise((resolve, reject) => {
      if (typeof type === 'string' && typeof name === 'string') {
        new RowType({
          type,
          name
        }).save((err, doc) => {
          if (err) {
            reject(err);
          } else {
            resolve(doc);
          }
        });
      } else {
        reject(`${scriptPath}: newRow(type, name)参数非法`);
      }
    });
  },

  deleteRow: function(type, name) {
    return new Promise((resolve, reject) => {
      if (typeof type === 'string' && typeof name === 'string') {
        RowType.findOneAndRemove({ type, name }, (err, doc) => {
          if (err) {
            reject(err);
          } else {
            resolve(doc);
          }
        });
      } else {
        reject(`${scriptPath}: deleteRow(type, name)参数非法`);
      }
    });
  }
};
