'use strict';
const TableSet = require('../model/tableset');
const scriptPath = 'controller/tableset.js';

module.exports = {

  /**
   * Find all tables of the specifield user
   * @param {String} username
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
   * @param {String} username
   * @param {String} setname
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
   * @param {String} username
   * @param {String} setname
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
   * @param {String} username
   * @param {String} setname
   * @param {String} newname
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
   * @param {String} username
   * @param {String} setname
   * @param {Object} tableDef
   */
  newTable: function(username, setname, tableDef) {
    return new Promise((resolve, reject) => {
      if (typeof username === 'string' && typeof setname === 'string' &&
          tableDef && tableDef.name && tableDef.columns && tableDef.rows &&
          typeof tableDef.name === 'string' &&
          Array.isArray(tableDef.columns) && tableDef.columns.length > 0 &&
          Array.isArray(tableDef.rows) && tableDef.rows.length > 0) {

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
   * @param {String} username
   * @param {String} setname
   * @param {String} tablename
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
   * Rename table
   * @param {String} username
   * @param {String} setname
   * @param {String} tablename
   * @param {String} newname
   */
  renameTable: function(username, setname, tablename, newname) {
    return new Promise((resolve, reject) => {
      if (typeof username === 'string' && typeof setname === 'string' && typeof tablename === 'string' && typeof newname === 'string') {
        TableSet.findOne({ owner: username, name: setname }).exec().then((doc) => {
          if (doc) {
            let flag = false;
            let ftable = {};
            doc.tables.map((t) => {
              if (t.name === newname) flag = true;
              if (t.name === tablename) ftable = t;
            });
            if (ftable.name === undefined) {
              reject(`${scriptPath}: renameTable(username, setname, tablename, newname) 表'${setname}/${tablename}@${username}'不存在`);
            } else if (flag) {
              reject(`${scriptPath}: renameTable(username, setname, tablename, newname) 表'${setname}/${newname}@${username}'已存在`);
            } else {
              TableSet.findOneAndUpdate({ owner: username, name: setname }, { $pull: { tables: { name: tablename } } }).exec().then(() => {
                ftable.name = newname;
                TableSet.findOneAndUpdate({ owner: username, name: setname }, { $push: { tables: ftable } }, (err, doc) => {
                  if (err) {
                    reject(err);
                  } else {
                    resolve(doc);
                  }
                });
              }).catch((err) => {
                reject(err);
              });
            }
          } else {
            reject(`${scriptPath}: renameTable(username, setname, tablename, newname) 表集合'${setname}@${username}'不存在`)
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
