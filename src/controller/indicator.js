'use strict';
const scriptPath = 'controller/indicator.js';
const regMonth = /\d{6}/;
const OPTS = [ '+', '-', '*', '/', '(', ')' ];
const moment = require('moment');
let Indicator = require('../model/indicator');
let Cache = require('./cache');
let TablePixel = require('./tablepixel');
let myRule = require('../tool/myrule');

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

  /**
   * Delete indicator by name
   * @param {String} name
   */
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
  },

  /**
   * Calculate indicator expression
   * @param {String} name
   * @param {String} month
   * @param {String} rowname
   */
  calIndicator: function(name, month, rowname) {
    return new Promise((resolve, reject) => {
      if (typeof name === 'string'
      && typeof month === 'string' && regMonth.test(month)
      && typeof rowname === 'string') {
        let lastMonth = moment(month, 'YYYYMM').subtract(1, 'month').format('YYYYMM');
        let lastYear = moment(month, 'YYYYMM').subtract(1, 'year').format('YYYYMM');
        Cache.getCache(`indicator_${name}_${rowname}`, month).then((doc) => {
          if (doc.length === 1 && doc[0] !== undefined) {
            resolve(doc[0].value);
          } else {
            Indicator.findOne({ name }, (err, doc) => {
              if (err) {
                reject(err);
              } else if (!doc) {
                reject(`${scriptPath}: calIndicator(name, month, rowname) 无法找到对应指标'${name}'`);
              } else {
                let ruleItems = this.parseRuleToItems(doc.rule);
                let opnd = [];
                let opndPromise = [];
                for (let el of ruleItems) {
                  if (!opnd.includes(el) && !OPTS.includes(el)) {
                    opnd.push(el);
                    if (el.startsWith('上月')) {
                      opndPromise.push(TablePixel.getPixelValue(el, lastMonth, rowname));
                    } else if (el.startsWith('去年')) {
                      opndPromise.push(TablePixel.getPixelValue(el, lastYear, rowname));
                    } else {
                      opndPromise.push(TablePixel.getPixelValue(el, month, rowname));
                    }
                  }
                }
                Promise.all(opndPromise).then((res) => {
                  let opndDict = {};
                  for (let idx = 0; idx < res.length; idx++) {
                    opndDict[opnd[idx]] = res[idx];
                  }
                  let analyzedItems = [];
                  for (let idx = 0; idx < ruleItems.length; idx++) {
                    if (OPTS.includes(ruleItems[idx])) {
                      analyzedItems.push(ruleItems[idx]);
                    } else {
                      analyzedItems.push(opndDict[ruleItems[idx]].val.trim());
                    }
                  }
                  let ruleAnalyzed = analyzedItems.join('');
                  let ruleStr = '';
                  for (let el of ruleAnalyzed) {
                    if (el !== ',') ruleStr += el;
                  }
                  myRule(ruleStr).then((calres) => {
                    let calValue = {
                      row: 1,
                      col: analyzedItems.length,
                      val: calres.toString()
                    };
                    Cache.cache(`indicator_${name}_${rowname}`, month, calValue).then(() => {
                      resolve(calValue);
                    }).catch((err) => {
                      reject(err);
                    });
                  }).catch((err) => {
                    reject(err);
                  });
                }).catch((err) => {
                  reject(err);
                });
              }
            });
          }
        });
      } else {
        reject(`${scriptPath}: calIndicator(name, month, rowname) 参数非法`);
      }
    });
  },

  /**
   * Tool function to parse rule to items
   * @param {String} rule
   */
  parseRuleToItems: function(rule) {
    if (typeof rule === 'string') {
      let ruleItems = [];
      let opndstr = '';
      for (let el of rule) {
        if (OPTS.includes(el)) {
          if (opndstr.trim() !== '') {
            ruleItems.push(opndstr.trim());
            opndstr = '';
          }
          ruleItems.push(el);
        } else {
          opndstr += el;
        }
      }
      if (opndstr.trim() !== '') ruleItems.push(opndstr.trim());
      return ruleItems;
    } else {
      return [];
    }
  },

  /**
   * Recursive base function
   * @param {Array} ruleItems
   */
  extend: function(ruleItems) {
    return new Promise((resolve, reject) => {
      Indicator.find({}, (err, docs) => {
        if (err) {
          reject(err);
        } else {
          let elidx = -1;
          let elrule = '';
          for (let idx = 0; idx < ruleItems.length; idx++) {
            for (let el of docs) {
              if (el.name === ruleItems[idx]) {
                elidx = idx;
                elrule = el.rule;
                break;
              }
            }
            if (elidx >= 0) {
              break;
            }
          }
          if (elidx >= 0) {
            let elruleItems = this.parseRuleToItems(elrule);
            elruleItems.unshift('(');
            elruleItems.push(')');
            let args = [elidx, 1].concat(elruleItems);
            resolve({
              idx: elidx,
              args
            });
          } else {
            resolve({
              idx: elidx,
              args: []
            });
          }
        }
      });
    });
  },
  
  /**
   * Recursive function to extend rule expression
   * @param {Array} ruleItems
   */
  extendAll: function(ruleItems) {
    return this.extend(ruleItems).then(info => {
      if (info.idx >= 0) {
        Array.prototype.splice.apply(ruleItems, info.args);
        return this.extendAll(ruleItems);
      } else {
        return ruleItems;
      }
    });
  },

  /**
   * Test function to extend rule expression
   * @param {String} name
   */
  extendOnly: function(name) {
    return new Promise((resolve, reject) => {
      if (typeof name === 'string') {
        Indicator.findOne({ name }, (err, doc) => {
          if (err) {
            reject(err);
          } else if (!doc) {
            reject(`${scriptPath}: extendOnly(name) 无法找到对应指标'${name}'`);
          } else {
            let ruleItems = this.parseRuleToItems(doc.rule);
            this.extendAll(ruleItems).then((exps) => {
              resolve(exps.join(''));
            });
          }
        });
      } else {
        reject(`${scriptPath}: extendOnly(name) 参数非法 `);
      }
    });
  }
};
