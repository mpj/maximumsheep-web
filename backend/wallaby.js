module.exports = function () {
  return {
    files: [
      'src/**/*.js',
      'package-lock.json',
      '!src/**/test.js',
    ],  

    tests: [
      'src/**/test.js',
    ],

    env: {
      type: 'node',
      runner: 'node',
    },

    testFramework: 'jest'
  }
}