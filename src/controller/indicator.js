'use strict';
const scriptPath = 'controller/indicator.js';
const regMonth = /\d{6}/;
const OPTS = [ '+', '-', '*', '/', '(', ')' ];
const moment = require('moment');
const Indicator = require('../model/indicator');
const Cache = require('./cache');
const TablePixel = require('./tablepixel');
const myRule = require('../tool/myrule');

module.exports = {

  /**
   * Add new indicator
   * @param {string} type
   * @param {string} name
   * @param {string} rule
   * @return {Promise}
   */
  newIndicator: function(type, name, rule) {
    return new Promise((resolve, reject) => {
      if (typeof type === 'string' && typeof name === 'string' && typeof rule === 'string') {
        new Indicator({
          type,
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
        reject(`${scriptPath}: newIndicator(type, name, rule) 参数非法`);
      }
    });
  },

  /**
   * Get all indicators
   * @return {Promise}
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
   * @param {string} name
   * @return {Promise}
   */
  deleteIndicator: function(type, name) {
    return new Promise((resolve, reject) => {
      if (typeof type === 'string' && typeof name === 'string') {
        Indicator.findOneAndRemove({ type, name }, (err, res) => {
          if (err) {
            reject(err);
          } else {
            resolve(res);
          }
        });
      } else {
        reject(`${scriptPath}: deleteIndicator(type, name) 参数非法`);
      }
    });
  },

  /**
   * Calculate indicator expression
   * @param {string} type
   * @param {string} name
   * @param {string} month
   * @param {string} rowname
   */
  calIndicator: function(type, name, month, rowname) {
    return new Promise((resolve, reject) => {
      if (typeof type === 'string' && typeof name === 'string'
      && typeof month === 'string' && regMonth.test(month)
      && typeof rowname === 'string') {
        Cache.getCache(`indicator_${type}_${name}_${rowname}`, month).then((doc) => {
          if (doc.length === 1 && doc[0] !== undefined) {
            resolve(doc[0].value);
          } else {
            Indicator.findOne({ type, name }, (err, doc) => {
              if (err) {
                reject(err);
              } else if (!doc) {
                reject(`${scriptPath}: calIndicator(type, name, month, rowname) 无法找到对应指标'${name}'`);
              } else {
                let unextendRuleItems = parseRuleToItems(doc.rule);
                extendAll(unextendRuleItems).then(ruleItems => {
                  let opnd = [];
                  let opndPromise = [];
                  for (let el of ruleItems) {
                    if (!opnd.includes(el) && !OPTS.includes(el) && !/^\d+$/.test(el)) {
                      opnd.push(el);
                      let calargs = parsePrefix(el, month);
                      opndPromise.push(TablePixel.getPixelValue(calargs.name, calargs.month, rowname));
                    }
                  }
                  Promise.all(opndPromise).then((res) => {
                    let opndDict = {};
                    for (let idx = 0; idx < res.length; idx++) {
                      opndDict[opnd[idx]] = res[idx];
                    }
                    let analyzedItems = [];
                    for (let idx = 0; idx < ruleItems.length; idx++) {
                      if (OPTS.includes(ruleItems[idx]) || /^\d+$/.test(ruleItems[idx])) {
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
                      Cache.cache(`indicator_${type}_${name}_${rowname}`, month, calValue).then(() => {
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
                }).catch(err => {
                  reject(err);
                });
              }
            });
          }
        });
      } else {
        reject(`${scriptPath}: calIndicator(type, name, month, rowname) 参数非法`);
      }
    });
  },

  /**
   * Test function to extend rule expression
   * @param {string} name
   * @return {Promise}
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
            let ruleItems = parseRuleToItems(doc.rule);
            extendAll(ruleItems).then((exps) => {
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

/**
 * Parse rule string to rule item list
 * @param {string} rule 
 * @return {Promise}
 */
const parseRuleToItems = (rule) => {
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
};

/**
 * Get index and extend array of complex indicator
 * @param {Array} ruleItems 
 * @return {Promise}
 */
const extend = (ruleItems) => new Promise((resolve, reject) => {
  Indicator.find({}, (err, docs) => {
    if (err) {
      reject(err);
    } else {
      let elidx = -1;
      let elrule = '';
      let elprefix = '';
      for (let idx = 0; idx < ruleItems.length; idx++) {
        // skip if rule item is operator or pure number
        if (OPTS.includes(ruleItems[idx]) || /^\d+$/.test(ruleItems[idx])) continue;
        // get prefix & real content of rule item. prefix should be '今年累计' '去年累计' '上月' '去年同期' '2018XX'
        let name = dePrefix(ruleItems[idx]);
        if (name.prefix === '今年累计') {
          elidx = idx;
          elprefix = '';
          let firstMonth = `${moment().format('YYYY')}01`;
          let yearMonths = [];
          while(firstMonth !== moment().format('YYYYMM')) {
            yearMonths.push(`${firstMonth}${name.realname}`);
            firstMonth = moment(firstMonth, 'YYYYMM').add(1, 'month').format('YYYYMM');
          }
          elrule = yearMonths.join('+');
          break;
        } else if (name.prefix === '去年累计') {
          elidx = idx;
          elprefix = '';
          let stopMonth = moment().subtract(1, 'year').format('YYYYMM');
          let firstMonth = `${moment().subtract(1, 'year').format('YYYY')}01`;
          let yearMonths = [];
          while(firstMonth !== stopMonth) {
            yearMonths.push(`${firstMonth}${name.realname}`);
            firstMonth = moment(firstMonth, 'YYYYMM').add(1, 'month').format('YYYYMM');
          }
          elrule = yearMonths.join('+');
          break;
        } else {
          for (let el of docs) {
            if (el.name === name.realname) {
              // if indicator rule contains name, continue
              if (el.rule.indexOf(el.name) < 0) {
                elidx = idx;
                elrule = el.rule;
                elprefix = name.prefix;
              }
              break;
            }
          }
          if (elidx >= 0) {
            break;
          }
        }
      }
      if (elidx >= 0) {
        let elruleItems = parseRuleToItems(elrule);
        for (let idx = 0; idx < elruleItems.length; idx++) {
          if (!OPTS.includes(elruleItems[idx])) {
            elruleItems[idx] = elprefix + elruleItems[idx];
          }
        }
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

/**
 * Recursive analyze complex rule expression
 * @param {Array} ruleItems 
 * @return {Promise}
 */
const extendAll = (ruleItems) =>
  extend(ruleItems).then(info => {
    if (info.idx >= 0) {
      Array.prototype.splice.apply(ruleItems, info.args);
      return extendAll(ruleItems);
    } else {
      return ruleItems;
    }
  });

/**
 * Get prefix and real name of indicator 
 * @param {string} name 
 * @return {Promise}
 */
const dePrefix = (name) => {
  if (typeof name === 'string') {
    if (name.startsWith('今年累计')) {
      return {
        prefix: '今年累计',
        realname: name.slice('今年累计'.length)
      };
    } else if (name.startsWith('去年累计')) {
      return {
        prefix: '去年累计',
        realname: name.slice('去年累计'.length)
      };
    } else if (name.startsWith('上月')) {
      return {
        prefix: '上月',
        realname: name.slice('上月'.length)
      };
    } else if (name.startsWith('去年同期')) {
      return {
        prefix: '去年同期',
        realname: name.slice('去年同期'.length)
      };
    } else if (/^\d{6}/.test(name)) {
      return {
        prefix: name.slice(0, 6),
        realname: name.slice(6)
      };
    } else {
      return {
        prefix: '',
        realname: name
      };
    }
  } else {
    return {
      prefix: '',
      realname: name
    };
  }
};

/**
 * Parse indicator name with month
 * @param {string} name 
 * @param {string} month 
 */
const parsePrefix = (name, month) => {
  let lastMonth = moment(month, 'YYYYMM').subtract(1, 'month').format('YYYYMM');
  let lastYear = moment(month, 'YYYYMM').subtract(1, 'year').format('YYYYMM');
  let deprefixedName = dePrefix(name);
  if (deprefixedName.prefix === '上月') {
    return {
      month: lastMonth,
      name: deprefixedName.realname
    };
  } else if (deprefixedName.prefix === '去年同期') {
    return {
      month: lastYear,
      name: deprefixedName.realname
    };
  } else if (/^\d{6}/.test(deprefixedName.prefix)) {
    return {
      month: deprefixedName.prefix,
      name: deprefixedName.realname
    };
  } else {
    return {
      month,
      name
    };
  }
};
