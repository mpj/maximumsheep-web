const tokenStore = require("./")
const MongoClient = require("mongodb").MongoClient

const db = "twitch-token-bridge-dev-mpj"
const uri =
  "mongodb+srv://dev-mpj:B2Zer7MIXeIlUfzS@cluster0-lbv4m.gcp.mongodb.net/twitch-token-bridge-dev-mpj?retryWrites=true&w=majority"

const saveRefreshToken = tokenStore.saveRefreshToken.bind(
  null,
  MongoClient,
  uri,
  db
)
const loadRefreshToken = tokenStore.loadRefreshToken.bind(
  null,
  MongoClient,
  uri,
  db
)

saveRefreshToken("apas").then(() =>
  // eslint-disable-next-line no-console
  loadRefreshToken().then(tkn => console.log("loaded token", tkn))
)
