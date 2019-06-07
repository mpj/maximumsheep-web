const { Datastore } = require('@google-cloud/datastore')
const twitch = require('./modules/twitch')
const tokenStore = require('./modules/token-store')
const fetch = require('node-fetch')

// Configure twitch
const TWITCH_CLIENT_ID =  'vxcijp9ycl41wbfnjoxfvnesubzz3h'
const TWITCH_CLIENT_SECRET = 'wx0ikjck93uu261nvgy6ih9wzme4lb'
const TWITCH_CLIENT_REDIRECT_URI = 
  //'https://us-central1-ft-overlay.cloudfunctions.net/callback'
  'http://localhost:8010/video-coldline/us-central1/callback'
  //'http://localhost:8888/callback'

const getLoginURL = 
  twitch.getLoginURL.bind(null, TWITCH_CLIENT_ID, TWITCH_CLIENT_REDIRECT_URI)
const getTokensWithCode = 
  twitch.getTokensWithCode.bind(null, fetch, TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET, TWITCH_CLIENT_REDIRECT_URI)
const getTokensWithRefreshToken = 
  twitch.getTokensWithRefreshToken.bind(null, fetch, TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET)

const datastore = new Datastore({
  projectId: 'ft-overlay',
  keyFilename: './datastore-credentials.json',
})
const persistRefreshToken = 
  tokenStore.persistRefreshToken.bind(null, datastore)
const retriveRefreshToken = 
  tokenStore.retriveRefreshToken.bind(null, datastore)
  
exports.login = (req, res) => { 
  res.redirect(getLoginURL())
}

exports.callback = async (req, res) => {
  const code = req.query.code 
  console.log('getting tokens')
  let tokens 
  try {
    tokens = await getTokensWithCode(code)
  } catch(e) {
    res.status(403).send('Twitch considers this code invalid')
    return
  }

  await persistRefreshToken(tokens.refresh)
  res.send('Refresh token persisted, you can now go to /requestAccessToken')
}

exports.requestAccessToken = async (req, res) => {
  if(!req.body || req.body.secret !== 'secretsecretsecret') {
    res.status(401).send('This endpoint requires a JSON object with a correct "secret" property')
    return
  }

  const refreshToken = await retriveRefreshToken()
  if (!refreshToken) {
    res.status(401).send('No refresh token stored. Go to /login')
    return
  }
  let tokens
  try {
    tokens = await getTokensWithRefreshToken(refreshToken)
  }
  catch(error) {
    res.send(401).send('Could not get new tokes with refresh token (probably expired). Go to /login')
    return
  }
  await persistRefreshToken(tokens.refresh)
  res.send(tokens.access)
}