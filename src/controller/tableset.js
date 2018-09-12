'use strict';
const scriptPath = 'controller/tableset.js';
const XLSX = require('xlsx');
const config = require('../config');
const path = require('path');
const moment = require('moment');
const randomstr = require('randomstring');
let TableSet = require('../model/tableset');
let Pixels = require('./tablepixel');
let Indicators = require('./indicator');

module.exports = {

  /**
   * Find all tables of the specifield user
   * @param {string} username
   * @return {Promise}
   */
  findTablesByUser: function(username) {
    return new Promise((resolve, reject) => {
      if (typeof username === 'string') {
        TableSet.find({ owner: username }, (err, docs) => {
          if (err) {
            reject(err);
          } else {
            resolve(docs);
          }
        });
      } else {
        reject(`${scriptPath}: findTablesByUser() 参数非法`);
      }
    });
  },

  /**
   * Create a new table set
   * @param {string} username
   * @param {string} setname
   * @return {Promise}
   */
  newSet: function(username, setname) {
    return new Promise((resolve, reject) => {
      if (typeof username === 'string' && typeof setname === 'string') {
        new TableSet({
          owner: username,
          name: setname,
          tables: []
        }).save((err, doc) => {
          if (err) {
            reject(err);
          } else {
            resolve(doc);
          }
        });
      } else {
        reject(`${scriptPath}: newSet(username, setname) 参数非法`);
      }
    });
  },

  /**
   * Delete the specifield table set
   * @param {string} username
   * @param {string} setname
   * @return {Promise}
   */
  deleteSet: function(username, setname) {
    return new Promise((resolve, reject) => {
      if (typeof username === 'string' && typeof setname === 'string') {
        TableSet.findOne({ owner: username, name: setname }, (err, doc) => {
          if (err) {
            reject(err);
          } else {
            if (doc.tables.length) {
              reject(`${scriptPath}: deleteSet(username, setname) 集合'${setname}@${username}'非空`);
            } else {
              TableSet.deleteOne({ owner: username, name: setname }, (err) => {
                if (err) {
                  reject(err);
                } else {
                  resolve(doc);
                }
              });
            }
          }
        });
      } else {
        reject(`${scriptPath}: deleteSet(username, setname) 参数非法`);
      }
    });
  },

  /**
   * Rename table set
   * @param {string} username
   * @param {string} setname
   * @param {string} newname
   * @return {Promise}
   */
  renameSet: function(username, setname, newname) {
    return new Promise((resolve, reject) => {
      if (typeof username === 'string' && typeof setname === 'string' && typeof newname === 'string' && setname !== newname) {
        TableSet.findOneAndUpdate({ owner: username, name: setname }, { $set: { name: newname } }, (err, doc) => {
          if (err) {
            reject(err);
          } else {
            resolve(doc);
          }
        });
      } else {
        reject(`${scriptPath}: renameSet(username, setname, newname) 参数非法`);
      }
    });
  },

  /**
   * Add new table
   * @param {string} username
   * @param {string} setname
   * @param {Object} tableDef
   * @return {Promise}
   */
  newTable: function(username, setname, tableDef) {
    return new Promise((resolve, reject) => {
      if (typeof username === 'string' && typeof setname === 'string'
      && tableDef && tableDef.name && tableDef.columns && tableDef.rows
      && typeof tableDef.name === 'string'
      && Array.isArray(tableDef.columns) && tableDef.columns.length > 0
      && Array.isArray(tableDef.rows) && tableDef.rows.length > 0) {

        TableSet.findOne({ owner: username, name: setname }).exec().then((doc) => { //首先检查是否有重复表
          if (doc) {
            let flag = false;
            doc.tables.map((t) => {
              if (t.name === tableDef.name) flag = true;
            });
            if (flag) {
              reject(`${scriptPath}: newTable(username, setname, tableDef) 表'${setname}/${tableDef.name}@${username}'已存在`);
            } else {
              TableSet.findOneAndUpdate({
                owner: username, name: setname
              }, {
                $push: {
                  tables: {
                    name: tableDef.name,
                    columns: tableDef.columns,
                    rows: tableDef.rows,
                    observer: []
                  }
                } 
              },(err, doc) => {
                if (err) {
                  reject(err);
                } else {
                  resolve(doc);
                }
              });
            }
          } else {
            reject(`${scriptPath}: newTable(username, setname, tableDef) 表集合'${setname}@${username}'不存在`);
          }
        }).catch((err) => {
          reject(err);
        });
      } else {
        reject(`${scriptPath}: newTable(username, setname, tableDef) 参数非法`);
      }
    });
  },

  /**
   * Delete table by tablename
   * @param {string} username
   * @param {string} setname
   * @param {string} tablename
   * @return {Promise}
   */
  deleteTable: function(username, setname, tablename) {
    return new Promise((resolve, reject) => {
      if (typeof username === 'string' && typeof setname === 'string' && typeof tablename === 'string') {
        TableSet.findOneAndUpdate({ owner: username, name: setname }, { $pull: { tables: { name: tablename } } }, (err, doc) => {
          if (err) {
            reject(err);
          } else {
            resolve(doc);
          }
        });
      } else {
        reject(`${scriptPath}: deleteTable(username, setname, tablename) 参数非法`);
      }
    });
  },

  /**
   * Generate table content
   * @param {String} username
   * @param {String} setname
   * @param {String} tablename
   */
  genTable: function(username, setname, tablename) {
    return new Promise((resolve, reject) => {
      if (typeof username === 'string' && typeof setname === 'string' && typeof tablename === 'string') {
        TableSet.findOne({ owner: username, name: setname }, (err, setdoc) => {
          if (err) {
            reject(err);
          } else {
            let table;
            setdoc.tables.map(t => {
              if (t.name === tablename) table = t;
            });
            if (table !== undefined) {
              Promise.all([Pixels.allPixels(), Indicators.allIndicators()]).then(docs => {
                let pixels = docs[0];
                let indicators = docs[1];
                let tablePromise = [];
                table.rows.map(row => {
                  table.columns.map(col => {
                    let flag = false;
                    // Check if column in pixels, add promise
                    pixels.map(pix => {
                      if (pix.name === col.name) {
                        flag = true;
                        tablePromise.push(Pixels.getPixelValue(col.name, col.month, row));
                      }
                    });
                    // Check if column in indicators, add promise
                    indicators.map(ind => {
                      if (ind.name === col.name) {
                        flag = true;
                        tablePromise.push(Indicators.calIndicator(col.name, col.month, row));
                      }
                    });
                    // Else throw exception
                    if (!flag) {
                      reject(`${scriptPath}: genTable(username, setname, tablename) 无法找到指标或者Excel元素'${col.name}'`);
                    }
                  });
                });
                // Execution promise to get all value
                Promise.all(tablePromise).then(docs => {
                  let headers = [];
                  table.columns.map(col => {
                    headers.push(col.label);
                  });
                  let data = [];
                  let rowitems = {};
                  docs.map((el, idx) => {
                    if (idx % table.columns.length === 0) {
                      if (idx !== 0) {
                        data.push(rowitems);
                        rowitems = {};
                      }
                      rowitems[tablename] = table.rows[Math.floor(idx/table.columns.length)];
                    }
                    rowitems[headers[idx % table.columns.length]] = el.val;
                  });
                  resolve(data);
                }).catch(err => {
                  reject(err);
                });
                // Generate Excel
              }).catch(err => {
                reject(err);
              });
            } else {
              reject(`${scriptPath}: genTable(username, setname, tablename) 找不到记录'${setname}/${tablename}'`);
            }
          }
        });
      } else {
        reject(`${scriptPath}: genTable(username, setname, tablename) 参数非法`);
      }
    });
  },

  /**
   * Generate xlsx file by 'data' and 'headers' (optional)
   * @param {String} sheetName
   * @param {Array} data
   * @param {Array} headers
   */
  genXLSX: function(username, sheetname, data, headers=[]) {
    return new Promise((resolve, reject) => {
      if (typeof username === 'string' && typeof sheetname === 'string' && Array.isArray(data)) {
        let wb = XLSX.utils.book_new();
        let ws;
        if (headers.length) {
          ws = XLSX.utils.json_to_sheet(data, headers);
        } else {
          ws = XLSX.utils.json_to_sheet(data);
        }
        XLSX.utils.book_append_sheet(wb, ws, sheetname);
        let filename = `${config.downloadDir}${path.sep}${username}_${moment().format('YYYYMMDDHHmmss')}_${randomstr.generate(4)}.xlsx`;
        XLSX.writeFile(wb, filename);
        resolve(filename);
      } else {
        reject(`${scriptPath}: genXLSX(username, sheetname, data, headers(optional)) 参数非法`);
      }
    });
  },

  /**
   * Rename table
   * @param {string} username
   * @param {string} setname
   * @param {string} tablename
   * @param {string} newname
   * @return {Promise}
   */
  renameTable: function(username, setname, tablename, newname) {
    return new Promise((resolve, reject) => {
      if (typeof username === 'string' && typeof setname === 'string' && typeof tablename === 'string' && typeof newname === 'string' && tablename !== newname) {
        TableSet.findOne({ owner: username, name: setname }).exec().then((doc) => {
          if (doc) {
            let flag = false;
            doc.tables.map((t) => {
              if (t.name === newname) flag = true;
            });
            if (flag) {
              reject(`${scriptPath}: renameTable(username, setname, tablename, newname) 表'${setname}/${newname}@${username}'已存在`);
            } else {
              TableSet.findOneAndUpdate({ 'owner': username, 'name': setname, 'tables.name': tablename }, { '$set': { 'tables.$.name': newname } }).exec().then(() => {
                resolve(doc);
              }).catch((err) => {
                reject(err);
              });
            }
          } else {
            reject(`${scriptPath}: renameTable(username, setname, tablename, newname) 表集合'${setname}@${username}'不存在`);
          }
        }).catch((err) => {
          reject(err);
        });
      } else {
        reject(`${scriptPath}: renameTable(username, setname, tablename, newname) 参数非法`);
      }
    });
  }

};
