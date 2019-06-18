module.exports = function () {
  return {
    files: [
      'pages/**/*.js',
      'package-lock.json',
      '!src/**/test.js',
    ],  

    tests: [
      'pages/**/test.js',
    ],

    env: {
      type: 'node',
      runner: 'node',
    },

    testFramework: 'jest'
  }
}