'use strict';

const myexcel = require('./myexcel');

let testwords = '201808/201801我是各种换算模板.xlsx 7、交换---联通给我的 市场部顺序 增值税口径 本月数 商洛';
// let testwords = '201808/201801我是各种换算模板.xlsx 7、交换---联通给我的 增量 累计 移动 商洛'
// let testwords = '201808/201801我是各种换算模板.xlsx 7、交换---联通给我的 流量 电信 累计 商洛'

myexcel(testwords).then((result) => {
  console.log(result);
}).catch((err) => {
  console.log(err);
});
