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
                  let parsedItems = parsePrefix(ruleItems, month);
                  let opnd = [];
                  let opndPromise = [];
                  for (let el of parsedItems) {
                    if (!opnd.includes(el) && !OPTS.includes(el) && !/^\d+$/.test(el)) {
                      opnd.push(el);
                      let calargs = sepMonthAndName(el);
                      opndPromise.push(TablePixel.getPixelValue(calargs.name, calargs.month, rowname));
                    }
                  }
                  Promise.all(opndPromise).then((res) => {
                    let opndDict = {};
                    for (let idx = 0; idx < res.length; idx++) {
                      opndDict[opnd[idx]] = res[idx];
                    }
                    let analyzedItems = [];
                    for (let idx = 0; idx < parsedItems.length; idx++) {
                      if (OPTS.includes(parsedItems[idx]) || /^\d+$/.test(parsedItems[idx])) {
                        analyzedItems.push(parsedItems[idx]);
                      } else {
                        analyzedItems.push(opndDict[parsedItems[idx]].val.trim());
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
   * @param {string} month
   * @return {Promise}
   */
  extendOnly: function(name, month) {
    return new Promise((resolve, reject) => {
      if (typeof name === 'string' && typeof month === 'string' && /^\d{6}$/.test(month)) {
        Indicator.findOne({ name }, (err, doc) => {
          if (err) {
            reject(err);
          } else if (!doc) {
            reject(`${scriptPath}: extendOnly(name, month) 无法找到对应指标'${name}'`);
          } else {
            let ruleItems = parseRuleToItems(doc.rule);
            extendAll(ruleItems).then((exps) => {
              resolve(parsePrefix(exps, month).join(''));
            });
          }
        });
      } else {
        reject(`${scriptPath}: extendOnly(name, month) 参数非法 `);
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
 * @param {Array<string>} ruleItems 
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
        // get prefix & real content of rule item. prefix should be '今年累计' '去年累计' '上月' '去年同期'
        let name = dePrefix(ruleItems[idx]);
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
        } // End of scan rules in mongo
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
    } // End of iter of rule items
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
 * @param {Array<string>} ruleItems 
 * @param {string} month 
 */
const parsePrefix = (ruleItems, month) => {
  // prefix for '上月'
  let lastMonth = moment(month, 'YYYYMM').subtract(1, 'month').format('YYYYMM');
  // prefix for '去年同期'
  let lastYear = moment(month, 'YYYYMM').subtract(1, 'year').format('YYYYMM');
  // prefix for '去年累计'
  let lastYearMonths = [];
  let tmpLast = `${moment(lastYear, 'YYYYMM').format('YYYY')}01`;
  lastYearMonths.push(tmpLast);
  while (tmpLast !== lastYear) {
    tmpLast = moment(tmpLast, 'YYYYMM').add(1, 'month').format('YYYYMM');
    lastYearMonths.push(tmpLast);
  }
  // prefix for '今年累计'
  let theYearMonths = [];
  let tmpThis = `${moment(month, 'YYYYMM').format('YYYY')}01`;
  theYearMonths.push(tmpThis);
  while (tmpThis !== month) {
    tmpThis = moment(tmpThis, 'YYYYMM').add(1, 'month').format('YYYYMM');
    theYearMonths.push(tmpThis);
  }

  let resultArr = [];
  for (let idx = 0; idx < ruleItems.length; idx++) {
    if (OPTS.includes(ruleItems[idx]) || /^\d+$/.test(ruleItems[idx])) {
      resultArr.push(ruleItems[idx]);
      continue;
    }
    let deprefixedName = dePrefix(ruleItems[idx]);
    if (deprefixedName.prefix === '上月') {
      resultArr.push(`${lastMonth}${deprefixedName.realname}`);
    } else if (deprefixedName.prefix === '去年同期') {
      resultArr.push(`${lastYear}${deprefixedName.realname}`);
    } else if (deprefixedName.prefix === '今年累计') {
      let replaceItems = [];
      for (let el of theYearMonths) {
        replaceItems.push(`${el}${deprefixedName.realname}`);
        replaceItems.push('+');
      }
      replaceItems[replaceItems.length-1] = ')';
      replaceItems.unshift('(');
      resultArr = resultArr.concat(replaceItems);
    } else if (deprefixedName.prefix === '去年累计') {
      let replaceItems = [];
      for (let el of lastYearMonths) {
        replaceItems.push(`${el}${deprefixedName.realname}`);
        replaceItems.push('+');
      }
      replaceItems[replaceItems.length-1] = ')';
      replaceItems.unshift('(');
      resultArr = resultArr.concat(replaceItems);
    } else {
      resultArr.push(`${month}${deprefixedName.realname}`);
    }
  }
  return resultArr;
};

const sepMonthAndName = (idname) => {
  return {
    name: idname.slice(6),
    month: idname.slice(0, 6)
  };
};
