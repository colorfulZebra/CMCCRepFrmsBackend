'use strict';
const scriptPath = 'controller/indicator.js';
let Indicator = require('../model/indicator');

module.exports = {

  /**
   * Add new indicator
   * @param {String} name
   * @param {String} rule
   */
  newIndicator: function(name, rule) {
    return new Promise((resolve, reject) => {
      if (typeof name === 'string' && typeof rule === 'string') {
        new Indicator({
          name,
          rule
        }).save((err, doc) => {
          if (err) {
            reject(err);
          } else {
            resolve(doc);
          }
        });
      } else {
        reject(`${scriptPath}: newIndicator(name, rule) 参数非法`);
      }
    });
  },

  /**
   * Get all indicators
   */
  allIndicators: function() {
    return new Promise((resolve, reject) => {
      Indicator.find({}, (err, docs) => {
        if (err) {
          reject(err);
        } else {
          resolve(docs);
        }
      });
    });
  },

  deleteIndicator: function(name) {
    return new Promise((resolve, reject) => {
      if (typeof name === 'string') {
        Indicator.findOneAndRemove({ name }, (err, res) => {
          if (err) {
            reject(err);
          } else {
            resolve(res);
          }
        });
      } else {
        reject(`${scriptPath}: deleteIndicator(name) 参数非法`);
      }
    });
  }
};
