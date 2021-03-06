'use strict';
const scriptPath = 'controller/tableset.js';
const XLSX = require('xlsx');
const config = require('../config');
const path = require('path');
const moment = require('moment');
const randomstr = require('randomstring');
const TableSet = require('../model/tableset');
const Indicators = require('./indicator');

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
   * Find the table defination by table name
   * @param {string} username 
   * @param {string} setname 
   * @param {string} tablename 
   */
  findTableByUser: function(username, setname, tablename) {
    return new Promise((resolve, reject) => {
      if (typeof username === 'string' && typeof setname === 'string' && typeof tablename === 'string') {
        TableSet.findOne({ owner: username, name: setname }, (err, doc) => {
          if (err) {
            reject(err);
          } else {
            let tableDef = {};
            doc.tables.map(tb => {
              if (tb.name === tablename) {
                tableDef = tb;
              }
            });
            resolve(tableDef);
          }
        });
      } else {
        reject(`${scriptPath}: findTableByUser(username, setname, tablename) 参数非法`);
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
   * @param {string} username
   * @param {string} setname
   * @param {string} tablename
   * @param {boolean} transpose
   */
  genTable: function(username, setname, tablename, transpose=false) {
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
              Indicators.allIndicators().then(indicators => {
                let tablePromise = [];
                table.rows.map(row => {
                  table.columns.map(col => {
                    let flag = false;
                    // Check if column in indicators, add promise
                    indicators.map(ind => {
                      if (ind.name === col.name) {
                        flag = true;
                        tablePromise.push(Indicators.calIndicator(col.ctype, col.name, col.month, row));
                      }
                    });
                    // Else throw exception
                    if (!flag) {
                      reject(`${scriptPath}: genTable(username, setname, tablename, transpose) 无法找到指标或者Excel元素'${col.name}'`);
                    }
                  });
                });
                // Execution promise to get all value
                Promise.all(tablePromise).then(docs => {
                  let headers = [];
                  headers.push(tablename);
                  table.columns.map(col => {
                    headers.push(col.label);
                  });
                  let data = [];
                  data.push(headers);
                  let rowitems = [];
                  rowitems.push(table.rows[0]);
                  docs.map((el, idx) => {
                    if (idx && idx % table.columns.length === 0) {
                      data.push(rowitems);
                      rowitems = [];
                      rowitems.push(table.rows[Math.floor(idx / table.columns.length)]);
                    }
                    rowitems.push(parseFloat(parseFloat(el.val.replace(/,(?=[\d,]*\.\d{2}\b)/g,'')).toFixed(4)));
                  });
                  if (transpose) {
                    let transposedData = [];
                    for (let i = 0; i < data[0].length; i++) {
                      let tmprow = [];
                      for (let j = 0; j < data.length; j++) {
                        tmprow[j] = data[j][i];
                      }
                      transposedData.push(tmprow);
                    }
                    data = transposedData;
                  }
                  resolve({
                    setname,
                    table: tablename,
                    data
                  });
                }).catch(err => {
                  reject(err);
                });
                // Generate Excel
              }).catch(err => {
                reject(err);
              });
            } else {
              reject(`${scriptPath}: genTable(username, setname, tablename, transpose) 找不到记录'${setname}/${tablename}'`);
            }
          }
        });
      } else {
        reject(`${scriptPath}: genTable(username, setname, tablename, transpose) 参数非法`);
      }
    });
  },

  /**
   * Generate table data array by table list
   * @param {string} username
   * @param {Array} tablelist
   */
  genTables: function(username, tablelist) {
    return new Promise((resolve, reject) => {
      if (typeof username === 'string' && Array.isArray(tablelist)) {
        let tablePromises = tablelist.map(tb => {
          return this.genTable(username, tb.set, tb.name, tb.transpose);
        });
        Promise.all(tablePromises).then(tabledocs => {
          resolve(tabledocs);
        }).catch(err => {
          reject(err);
        });
      } else {
        reject(`${scriptPath}: genTables(username, tablelist) 参数非法`);
      }
    });
  },

  /**
   * Generate xlsx file by 'data' and 'headers' (optional)
   * @param {string} sheetName
   * @param {Array} data
   */
  genXLSX: function(username, sheetname, data) {
    return new Promise((resolve, reject) => {
      if (typeof username === 'string' && typeof sheetname === 'string' && Array.isArray(data)) {
        let wb = XLSX.utils.book_new();
        let ws = XLSX.utils.json_to_sheet(data, { skipHeader: true });
        XLSX.utils.book_append_sheet(wb, ws, sheetname);
        let filename = `${username}_${moment().format('YYYYMMDDHHmmss')}_${randomstr.generate(4)}.xlsx`;
        XLSX.writeFile(wb, `${config.downloadDir}${path.sep}${filename}`);
        resolve(filename);
      } else {
        reject(`${scriptPath}: genXLSX(username, sheetname, data) 参数非法`);
      }
    });
  },

  genXLSXs: function(username, tabledocs) {
    return new Promise((resolve, reject) => {
      if (typeof username === 'string' && Array.isArray(tabledocs)) {
        let wb = XLSX.utils.book_new();
        for (let td of tabledocs) {
          if (wb.SheetNames.includes(td.setname)) {
            let ws = wb.Sheets[td.setname];
            let wsRange = ws['!ref'];
            let match = /[a-zA-Z]+[0-9]+:[a-zA-Z]+([0-9]+)/.exec(wsRange);
            let ttcol = parseInt(match[1]);
            if (isNaN(ttcol)) {
              reject(`${scriptPath}: genXLSXs(username, tabledocs) 获取sheet'${td.setname}'范围错误`);
            }
            XLSX.utils.sheet_add_json(ws, td.data, { skipHeader: true, origin: ttcol + 2 });
          } else {
            let ws = XLSX.utils.json_to_sheet(td.data, { skipHeader: true });
            XLSX.utils.book_append_sheet(wb, ws, td.setname);
          }
        }
        let filename = `${username}_${moment().format('YYYYMMDDHHmmss')}_${randomstr.generate(4)}.xlsx`;
        XLSX.writeFile(wb, `${config.downloadDir}${path.sep}${filename}`);
        resolve(filename);
      } else {
        reject(`${scriptPath}: genXLSXs(username, tabledocs) 参数非法`);
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
  },

  /**
   * 
   * @param {string} username 
   * @param {string} setname 
   * @param {string} tablename 
   */
  syncTable: function(username, setname, tablename) {
    return new Promise((resolve, reject) => {
      if (typeof username === 'string' && typeof setname === 'string' && typeof tablename === 'string') {
        TableSet.findOne({ owner: username, name: setname }, (err, doc) => {
          if (err) {
            reject(err);
          } else if (doc) {
            let flag = false;
            let tabledef = [];
            doc.tables.map(tb => {
              if (tb.name === tablename) {
                flag = true;
                tabledef = tb.columns;
              }
            });
            if (flag) {
              let parsedef = [];
              tabledef.map(c => {
                let eflag = false;
                parsedef.map(ec => {
                  if (ec.ctype === c.ctype && ec.name === c.name) {
                    eflag = true;
                  }
                });
                if (!eflag) {
                  parsedef.push({ ctype:c.ctype, name:c.name });
                }
              });
              let firstmonth = moment().subtract(1, 'month').format('YYYY01');
              let lastmonth = moment().format('YYYYMM');
              let newmonths = [];
              while (firstmonth !== lastmonth) {
                newmonths.push(firstmonth);
                firstmonth = moment(firstmonth, 'YYYYMM').add(1, 'month').format('YYYYMM');
              }
              let parseddef =  [];
              newmonths.map(mel => {
                parsedef.map(cel => {
                  parseddef.push({
                    ctype: cel.ctype,
                    name: cel.name,
                    month: mel,
                    label: `${moment(mel, 'YYYYMM').format('YYYY年MM月')}${cel.name}`
                  });
                });
              });
              TableSet.findOneAndUpdate({ 'owner': username, 'name': setname, 'tables.name': tablename }, { $set: { 'tables.$.columns': parseddef } }, (err, doc) => {
                if (err) {
                  reject(err);
                } else {
                  resolve(doc);
                }
              });
            } else {
              reject(`${scriptPath}: syncTable(username, setname, tablename) 表'${setname}/${tablename}@${username}'不存在`);
            }
          } else {
            reject(`${scriptPath}: syncTable(username, setname, tablename) 表集合'${setname}@${username}'不存在`);
          }
        });
      } else {
        reject(`${scriptPath}: syncTable(username, setname, tablename) 参数非法`);
      }
    });
  }
};
