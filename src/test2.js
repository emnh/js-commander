function sum_2(a, b) {
  return a + b;
}

function sum_3(a, b, c) {
  return a + b + c;
}

function sum_2minc(a, b, c) {
  return a + b - c;
}

function patch() {
  JC.renameArg({
    scope: 'sum',
    updateCallSiteScope: '*',
    src: 'a',
    dst: 'addend1',
  });

  JC.renameArg({
    scope: 'sum',
    updateCallSiteScope: '*',
    src: 'b',
    dst: 'addend2'
  });

  JC.replace({
    scope: 'sum',
    src: 'return a + b;',
    dst: 'return a + b + c;'
  });
}
