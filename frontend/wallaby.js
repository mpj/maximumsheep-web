module.exports = function (wallaby) {
  return {
    files: [
      'package-lock.json',
      'src/**/*.js?(x)',
      '!src/**/*.test.js?(x)',
    ],  

    tests: [
      'src/**/*.test.js?(x)',
    ],

    env: {
      type: 'node',
      runner: 'node',
    },

    compilers: {
      'src/**/*.js?(x)': wallaby.compilers.babel()
    },
    
    testFramework: 'jest'
  }
}