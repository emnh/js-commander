const esprima = require('esprima');

function sum(a, b) {
  function v1() {
    return a + b;
  }

  function v2(c) {
    return v1() + c;
  }

  function v3(c) {
    return v1() - c;
  }

  // Inserted
  return [v1, v2, v3];
}

// Inserted
const sum_v1 = function(a, b) { sum(a, b)[0](); };
const sum_v2 = function(a, b, c) { sum(a, b)[0](c); };
const sum_v3 = function(a, b, c) { sum(a, b)[0](c); };

const funs = this;

function resolve(f, args) {
  const fname = Object.keys(f)[0];
  const fver = f[fname];
  const f = funs[fname];
  return f(rargs);
};

// Only choice is v1. Default v1.
console.log(resolve({ sum: 'v1' }, { a: 1, b: 2 }));
// Inserted
// sum_v1(1, 2);

// Choices are v1 or v2 or v3. Default v2.
console.log(resolve({ sum: 'v2' }, { a: 1, b: 2, c: 3}));
// Inserted
// sum_v2(1, 2, 3);
