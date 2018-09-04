'use strict';

let myrule = require('./myrule');

let tester = '1.9 / (a.0 + 2.0)';

console.log(tester);
myrule(tester).then((res) => {
  console.log(res);
}).catch((err) => {
  console.log(err);
});
