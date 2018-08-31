'use strict';
const path = require('path');
const scriptPath = 'controller/excel.js';
const fs = require('fs');
const XLSX = require('xlsx');
const regMonthID = /\d{6}/;
let Excel = require('../model/excel');
let myExcel = require('../tool/myexcel');

module.exports = {
  /**
   * Record excel content in db
   * @param {String} excelPath
   * @param {String} monthID
   */
  recordExcel: function(excelPath, monthID) {
    return new Promise((resolve, reject) => {
      if (typeof excelPath === 'string' && typeof monthID === 'string' && regMonthID.test(monthID) && (excelPath.endsWith('.xls') || excelPath.endsWith('.xlsx') || excelPath.endsWith('.xlsm'))) {
        let workbook;
        let sheets = [];
        workbook = XLSX.readFile(excelPath);
        for (let sheet of workbook.SheetNames) {
          let worksheet = workbook.Sheets[sheet];
          let sheetJson = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            blankrows: true
          });
          sheets.push({
            month: monthID,
            excel: excelPath.split(path.sep).slice(-1)[0],
            sheet,
            content: sheetJson
          });
        }
        Excel.deleteMany({ month: monthID, excel: excelPath.split(path.sep).slice(-1)[0] }, (err) => {
          if (err) {
            reject(err);
          } else {
            Excel.insertMany(sheets, (err, docs) => {
              if (err) {
                reject(err);
              } else {
                let resInfo = {
                  total: docs.length,
                  sheets: []
                };
                for (let el of docs) {
                  resInfo.sheets.push({
                    excelSheet: el.month + path.sep + el.excel + path.sep + el.sheet,
                    rows: el.content.length
                  });
                }
                resolve(resInfo);
              }
            });
          }
        });
      } else {
        reject(`${scriptPath}: recordExcel(excelPath, monthID) 参数非法`);
      }
    });
  },

  /**
   * Record all excels in specifield folder
   * @param {String} folderPath
   * @param {String} monthID
   */
  recordExcelsOfFolder: function(folderPath, monthID) {
    return new Promise((resolve, reject) => {
      if (typeof folderPath === 'string' && typeof monthID === 'string' && regMonthID.test(monthID)) {
        let sheets = [];
        for (let file of fs.readdirSync(folderPath)) {
          if (file.endsWith('.xls') || file.endsWith('.xlsx') || file.endsWith('.xlsm')) {
            let excelPath = `${folderPath}${path.sep}${file}`;
            let workbook = XLSX.readFile(excelPath);
            for (let sheet of workbook.SheetNames) {
              let worksheet = workbook.Sheets[sheet];
              let sheetJson = XLSX.utils.sheet_to_json(worksheet, {
                header: 1,
                blankrows: true
              });
              sheets.push({
                month: monthID,
                excel: file,
                sheet,
                content: sheetJson
              });
            }
          }
        }
        Excel.deleteMany({ month: monthID }, (err) => {
          if (err) {
            reject(err);
          } else {
            Excel.insertMany(sheets, (err, docs) => {
              if (err) {
                reject(err);
              } else {
                let resInfo = {
                  total: docs.length,
                  sheets: []
                };
                for (let el of docs) {
                  resInfo.sheets.push({
                    excelSheet: el.month + path.sep + el.excel + path.sep + el.sheet,
                    rows: el.content.length
                  });
                }
                resolve(resInfo);
              }
            });
          }
        });
      } else {
        reject(`${scriptPath}: recordExcelOfFolder(folderPath, monthID) 参数非法`);
      }
    });
  },

  /**
   * Get excel doc by fuzzy query
   * @param {String} month
   * @param {String} excelFuz
   * @param {String} sheetFuz
   */
  fuzzyQueryExcel: function(month, excelFuz, sheetFuz) {
    return new Promise((resolve, reject) => {
      if (typeof month === 'string' && regMonthID.test(month)
      && typeof excelFuz === 'string'
      && typeof sheetFuz === 'string') {
        let regExcel = new RegExp(excelFuz);
        let regSheet = new RegExp(sheetFuz);
        Excel.findOne({ month, excel: regExcel, sheet: regSheet }, (err, doc) => {
          if (err) {
            reject(err);
          } else {
            resolve(doc);
          }
        });
      } else {
        reject(`${scriptPath}: getExcel(month, excelFuz, sheetFuz) 参数非法`);
      }
    });
  },

  /**
   * Calculate cell value by keywords
   * @param {String} month
   * @param {String} excel
   * @param {String} sheet
   * @param {String} keywords
   */
  cell: function(month, excel, sheet, keywords) {
    return new Promise((resolve, reject) => {
      if (typeof month === 'string' && regMonthID.test(month)
      && typeof excel === 'string'
      && typeof sheet === 'string'
      && typeof keywords === 'string') {
        this.fuzzyQueryExcel(month, excel, sheet).then((doc) => {
          if (!doc.content) {
            reject(`${scriptPath}: cell(month, excel, sheet, keywords) 找不到记录${month}/${excel}/${sheet}`);
          } else {
            myExcel(doc.content, keywords).then((data) => {
              resolve(data);
            }).catch((err) => {
              reject(err);
            });
          }
        }).catch((err) => {
          reject(err);
        });
      } else {
        reject(`${scriptPath}: cell(month, excel, sheet, keywords) 参数非法`);
      }
    });
  }
};
