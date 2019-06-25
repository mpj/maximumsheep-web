module.exports = function (wallaby) {
  return {
    files: [
      'package-lock.json',
      'pages/**/*.js?(x)',
      '!pages/**/*.test.js?(x)',
      'helpers/**/*.js?(x)',
      '!helpers/**/*.test.js?(x)',
    ],  

    tests: [
      'pages/**/*.test.js?(x)',
    ],

    env: {
      type: 'node',
      runner: 'node',
    },

    compilers: {
      '**/*.js?(x)': wallaby.compilers.babel()
    },
    
    testFramework: 'jest'
  }
}