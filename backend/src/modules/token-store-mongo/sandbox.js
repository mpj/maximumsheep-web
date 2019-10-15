const tokenStore = require("./")
const MongoClient = require("mongodb").MongoClient
require("dotenv").config({})

const saveRefreshToken = tokenStore.saveRefreshToken.bind(
  null,
  MongoClient,
  process.env.MONGO_URI,
  process.env.MONGO_DB
)
const loadRefreshToken = tokenStore.loadRefreshToken.bind(
  null,
  MongoClient,
  process.env.MONGO_URI,
  process.env.MONGO_DB
)

saveRefreshToken("apas").then(() =>
  // eslint-disable-next-line no-console
  loadRefreshToken().then(tkn => console.log("loaded token", tkn))
)
