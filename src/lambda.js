const { json } = require('micro')
const twitch = require('./modules/twitch')
const fetch = require('node-fetch')
const queryString = require('query-string')

module.exports = (req, res) => {
  if (req.url === '/login') login(req, res)
  else if (req.url.includes('/callback')) callback(req, res)
  else if (req.url === '/request-token') requestToken(req, res)
  else res.end('not a valid url')
}

function login(req, res) {
  // TODO annoyingly broad
  const scope =
    'user_read channel_read channel:read:subscriptions channel_subscriptions'
  res.writeHead(302, {
    Location: getLoginURL(scope)
  })
  res.end()
}

async function callback(req, res) {
  console.log('callback entered')
  const code = queryString.parseUrl(req.url).query.code
  console.log('getting tokens')
  let tokens
  try {
    tokens = await getTokensWithCode(code)
  } catch (e) {
    res.writeHead(403)
    res.end('Twitch considers this code invalid')
    return
  }

  await saveRefreshToken(tokens.refresh)
  res.end('Refresh token persisted, you can now go to /request-token')
}

async function requestToken(req, res) {
  let body
  try {
    body = await json(req)
  } catch (e) {
    res.writeHead(400)
    res.end('failed parsing json from request, you must post JSON')
    return
  }
  if (!body || body.secret !== process.env.MAIN_CLIENT_SECRET) {
    res.writeHead(401)
    res.end(
      'This endpoint requires a JSON object with a correct "secret" property'
    )
    return
  }

  const refreshToken = await loadRefreshToken()
  if (!refreshToken) {
    res.writeHead(401)
    res.end('No refresh token stored. Go to /login')
    return
  }
  let tokens
  try {
    tokens = await getTokensWithRefreshToken(refreshToken)
  } catch (error) {
    res.writeHead(401)
    res.end(
      'Could not get new tokes with refresh token (probably expired). Go to /login'
    )
    return
  }
  await saveRefreshToken(tokens.refresh)
  res.end(tokens.access)
}

const getLoginURL = twitch.getLoginURL.bind(
  null,
  process.env.TWITCH_CLIENT_ID,
  process.env.TWITCH_CLIENT_REDIRECT_URI
)
const getTokensWithCode = twitch.getTokensWithCode.bind(
  null,
  fetch,
  process.env.TWITCH_CLIENT_ID,
  process.env.TWITCH_CLIENT_SECRET,
  process.env.TWITCH_CLIENT_REDIRECT_URI
)
const getTokensWithRefreshToken = twitch.getTokensWithRefreshToken.bind(
  null,
  fetch,
  process.env.TWITCH_CLIENT_ID,
  process.env.TWITCH_CLIENT_SECRET
)

const tokenStore = require('./modules/token-store-mongo')

const MongoClient = require('mongodb').MongoClient

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
