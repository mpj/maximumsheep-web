require("dotenv").config()
const webpack = require('webpack')

module.exports = {
  target: "serverless",
  webpack: (config) => {
    config.plugins.push(
      new webpack.EnvironmentPlugin(process.env)
    )
    return config
  }
}