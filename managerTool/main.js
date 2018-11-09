'use strict';
const baseUrl = 'http://localhost:9000/api/pixel';
const cacheUrl = 'http://localhost:9000/api/cache';
const urls = {
  queryAll: `${baseUrl}/query`,
  newPixel: `${baseUrl}/new`,
  deletePixel: `${baseUrl}/delete`,
  valuePixel: (name, rowname) => { return `${baseUrl}/value?month=201801&name=${name}&rowname=${rowname}` },
  cleanCache: `${cacheUrl}/clean`
};
const process = require('process');
const axios = require('axios');

function showHelp() {
  console.log("showall: 显示所有已定义指标\n");
  console.log("addpixel: 增加新指标\n");
  console.log("deletepixel: 删除指定指标\n");
  console.log("valuepixel: 验证指标值\n");
  console.log("cleancache: 清除缓存\n");
}

function showAll() {
  axios.get(urls.queryAll).then((resp) => {
    console.log(resp.data);
  }).catch((err) => {
    console.log(err.message);
  });
}

function addPixel() {
  const newpixelObj = require('./new.pixel.json');
  axios.post(urls.newPixel, newpixelObj).then((resp) => {
    console.log(resp.data);
  }).catch((err) => {
    console.log(err.message);
  })
}

function deletePixel() {
  const deletepixelObj = require('./delete.pixel.json');
  axios.delete(urls.deletePixel, { data: deletepixelObj }).then((resp) => {
    console.log(resp.data);
  }).catch((err) => {
    console.log(err.message);
  });
}

function valuePixel() {
  const valuepixelObj = require('./value.pixel.json');
  let requrl = urls.valuePixel(valuepixelObj.name, valuepixelObj.rowname);
  axios.get(encodeURI(requrl)).then((resp) => {
    console.log(resp.data);
  }).catch((err) => {
    console.log(err.message);
  })
}

function cleanCache() {
  axios.get(urls.cleanCache).then((resp) => {
    console.log(resp.data);
  }).catch((err) => {
    console.log(err.message);
  });
}

function main() {
  let cmd = process.argv[2]
  switch (cmd) {
    case 'showall':
      showAll();
      break;
    case 'cleancache':
      cleanCache();
      break;
    case 'addpixel':
      addPixel();
      break;
    case 'deletepixel':
      deletePixel();
      break;
    case 'valuepixel':
      valuePixel();
      break;
    default:
      showHelp();
      break;
  }
}

main();
