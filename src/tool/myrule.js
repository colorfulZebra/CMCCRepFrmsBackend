'use strict';

const scriptPath = 'tool/myrule.js';

const OPTR_PRIORITY = {
  '+' : {
    '+' : 1, '-' : 1, '*' : -1, '/' : -1, '(' : -1, ')' : 1, '#' : 1
  },
  '-' : {
    '+' : 1, '-' : 1, '*' : -1, '/' : -1, '(' : -1, ')' : 1, '#' : 1
  },
  '*' : {
    '+' : 1, '-' : 1, '*' : 1, '/' : 1, '(' : -1, ')' : 1, '#' : 1
  },
  '/' : {
    '+' : 1, '-' : 1, '*' : 1, '/' : 1, '(' : -1, ')' : 1, '#' : 1
  },
  '(' : {
    '+' : -1, '-' : -1, '*' : -1, '/' : -1, '(' : -1, ')' : 0
  },
  ')' : {
    '+' : 1, '-' : 1, '*' : 1, '/' : 1, ')' : 1, '#' : 1
  },
  '#' : {
    '+' : -1, '-' : -1, '*' : -1, '/' : -1, '(' : -1, '#' : 0
  }
};

const RECOGNISE_OPT = Object.keys(OPTR_PRIORITY);

/**
 * Calculate the expression
 * @param {string} rule 
 * @return {string}: Result of expression
 */
function analyze(rule) {
  if (typeof rule !== 'string') {
    throw `${scriptPath}: analyze(rule) 参数非法`;
  }
  if (!rule.endsWith('#')) {
    rule = rule + '#';
  }
  let OPND = [];
  let OPTR = [ '#' ];
  let opndstr = '';
  let idx = 0;
  let el = rule[idx];
  while (el !== '#' || OPTR[OPTR.length-1] !== '#') {
    if (RECOGNISE_OPT.includes(el)) {
      if (opndstr.trim() !== '') {
        OPND.push(opndstr.trim());
      }
      opndstr = '';

      if (OPTR_PRIORITY[OPTR[OPTR.length-1]][el] === -1) {
        OPTR.push(el);
        el = rule[++idx];
      } else if (OPTR_PRIORITY[OPTR[OPTR.length-1]][el] === 0) {
        OPTR.pop();
        el = rule[++idx];
      } else if (OPTR_PRIORITY[OPTR[OPTR.length-1]][el] === 1) {
        let a = parseFloat(OPND.pop());
        let b = parseFloat(OPND.pop());
        if (isNaN(a) || isNaN(b)) {
          throw `${scriptPath}: analyze(rule) 计算表达式非法计算数`;
        }
        let op = OPTR.pop();
        let r = 0.0;
        switch(op) {
        case '+':
          r = a + b;
          break;
        case '-':
          r = b - a;
          break;
        case '*':
          r = a * b;
          break;
        case '/':
          r = b / a;
          break;
        }
        OPND.push(r);
      } else {
        throw `${scriptPath}: analyze(rule) 计算表达式非法计算符号`;
      }
    } else {
      opndstr += el;
      el = rule[++idx];
    }
  }
  if (!OPND.length) {
    return parseFloat(opndstr.trim());
  } else {
    return OPND.pop();
  }
}

module.exports = function(rule) {
  return new Promise((resolve, reject) => {
    try {
      let res = analyze(rule);
      resolve(res);
    } catch(err) {
      reject(err);
    }
  });
};
