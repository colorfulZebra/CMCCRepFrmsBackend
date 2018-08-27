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
        TableSet.find({owner: username}, (err, docs) => {
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
        TableSet.findOne({ owner: username, name: setname }, (err, doc) => {
          if (err) {
            reject(err);
          } else {
            if (doc) {
              reject(`${scriptPath}: newSet(username, setname) 集合'${setname}'已经存在`);
            } else {
              let newRecord = new TableSet({
                owner: username,
                name: setname,
                tables: []
              });
              newRecord.save((err, doc) => {
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
              reject(`${scriptPath}: deleteSet(username, setname) 集合'${setname}'非空`);
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
   * Add new table
   * @param {String} username
   * @param {String} setname
   * @param {Object} tableDef
   */
  newTable: function(username, setname, tableDef) {
    return new Promise((resolve, reject) => {
      if (typeof username === 'string' && typeof setname === 'string' &&
          tableDef.name && tableDef.columns && tableDef.rows && tableDef.observer &&
          typeof tableDef.name === 'string' &&
          Array.isArray(tableDef.columns) &&
          Array.isArray(tableDef.rows) &&
          Array.isArray(tableDef.observer)) {

        TableSet.find({ owner: username, name: setname }, (err, doc) => {
          if (err) {
            reject(err);
          } else {
            doc.tables.push(tableDef);
            resolve(doc);
          }
        });
      } else {
        reject(`${scriptPath}: newTable(username, setname, tableDef) 参数非法`);
      }
    });
  }

};
