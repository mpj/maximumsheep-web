const WebSocket = require('ws')
const fetch = require('node-fetch')
const express = require('express')
const querystring = require('querystring')
const Pusher = require('pusher')
const Encryptor = require('simple-encryptor')
const fs = require('fs')
const util = require('util')

const readFile = util.promisify(fs.readFile)

const clientId =  'vxcijp9ycl41wbfnjoxfvnesubzz3h'
const clientSecret = 'jisu74vwgbfjl8qw7letgcw697zapw'
const redirectURL = process.env.REDIRECT_URI || 'http://localhost:8888/callback'

const pusherConfig = {
  cluster: 'eu',
  appId: "776185",
  key: "6a89ed24ee1c6eada27e",
  secret: "36fc3c0a8341e10cf754"
}

const configured = {}
configured.getTokensWithCode = getTokens.bind(null, 'authorization_code', redirectURL, clientId, clientSecret)
configured.getTokensWithRefreshToken = getTokens.bind(null, 'refresh_token', null, clientId, clientSecret)
configured.getChannelId = getChannelId.bind(null, clientId)
configured.triggerPusherSubscriptionEvent = triggerPusher.bind(null, 
  pusherConfig.cluster, pusherConfig.appId, pusherConfig.key, pusherConfig.secret,
  'twitch-bridge',
  'subscriptions'
)
configured.encrypt = encrypt.bind(null, 'secretsecretsecret')
configured.refreshAccessTokenSet = refreshAccessTokenSet.bind(null, clientId, clientSecret)

const app = express()
app.get('/start', async function(req, res) {
  if (fs.existsSync('refreshtoken')) {
    const refreshToken = await readFile('refreshtoken', 'utf8')
    const tokens = await configured.refreshAccessTokenSet(refreshToken)
    res.status(200).send(tokens.access)
    return
  }
  res.redirect(twitchLoginURL)
})


app.get('/callback', async function(req, res) {
  const code = req.query.code
  if (!code) {
    res.status(400).send('Query parameter "code" required')
    return
  }
  
  const tokens = await configured.getTokens(code)

  fs.writeFileSync("refreshtoken", tokens.refresh)
  res.status(200).send(tokens.access)
  //startForwardingTwitchSubscriptionsToPusher(tokens.access)
})


let port = process.env.PORT || 8888
console.log(`Listening on port ${port}. Go /start to initiate.`)
app.listen(port)

async function startForwardingTwitchSubscriptionsToPusher(twitchOAuthAccessToken) {
  const channelId = await configured.getChannelId(twitchOAuthAccessToken)
  subscribeToSubscriptions(channelId, twitchOAuthAccessToken, pipe(
    configured.encrypt,
    configured.triggerPusherSubscriptionEvent
  ))
}

const twitchLoginURL = 
  'https://id.twitch.tv/oauth2/authorize' +
  '?' + 
  querystring.stringify({
    response_type: 'code',
    client_id: clientId,
    scope: 'user_read channel_read channel:read:subscriptions channel_subscriptions',
    redirect_uri: redirectURL
  })

function subscribeToSubscriptions(channelId, oAuthAccessToken, callback) {
  const topicName = 'channel-subscribe-events-v1'
  const socket = new WebSocket('wss://pubsub-edge.twitch.tv')
  socket.on('open', function open() {
    socket.send(JSON.stringify({
      "type": "LISTEN",
      "data": {
        "topics": [ topicName + '.' + channelId ],
        "auth_token": oAuthAccessToken
      }
    }))
  })

  socket.on('message', function handleMessage(payload) {
    const parsed = JSON.parse(payload)
    if (!parsed.data || !parsed.data.topic.includes('channel-subscribe-events-v1')) {
      return
    }
    const message = JSON.parse(parsed.data.message)
    callback({
      displayName: message['display_name'],
      cumulativeMonths: message['cumulative_months'],
      streakMonths: message['months'],
      subscriptionPlan: message['sub_plan'], // "Prime", "1000", "2000", "3000",
      isReSub: message['context'] ? 'resub' : 'sub',
      message: message['sub_message'] && {
        body: message['sub_message'].message,
        emotes: message['sub_message'].emotes,
      }
    })
  })

  return function cancel() {
    socket.terminate()
  }
}

function triggerPusher(cluster, appId, key, secret, channel, event, message) {
  const client = new Pusher({
    cluster,
    appId,
    key,
    secret
  })
  client.trigger(
    channel,
    event,
    message
  )
}

function pipe(...funcs) {
  return function pipeProcessor(startValue) {
    let lastReturnedValue = null
    for (const func of funcs) {
      lastReturnedValue = func(lastReturnedValue || startValue)
    }
    return lastReturnedValue
  }
}

function encrypt(secret, data) {
  return Encryptor(secret).encrypt(data)
}

function decrypt(secret, data) {
  return Encryptor(secret).decrypt(data)
}

function getTokens(grantType, redirectURL, clientId, clientSecret, code) {
  return fetch(
    'https://id.twitch.tv/oauth2/token?' +
      querystring.stringify({
        grant_type: grantType,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectURL,
        code
      })
    , { method: 'POST' }
  )
  .then(assertResponseOK)
  .then(parseResponseJSON)
  .then(tokenSetFromResponseBody)

  function tokenSetFromResponseBody (body) {
    if (
      !body.access_token || 
      !body.refresh_token || 
      !Number.isInteger(body.expires_in)
    ) {
      throw new Error('Response body cannot be parsed as token set')
    }
    return {
      expiresIn: body.expires_in,
      access: body.access_token,
      refresh: body.refresh_token
    }
  }
}



function getChannelId(clientId, oAuthAccessToken) {
  return fetch('https://api.twitch.tv/kraken/channel', {
    headers: {
      'Client-ID': clientId,
      'Authorization': 'OAuth ' + oAuthAccessToken
    }
  })
  .then(parseResponseJSON)
  .then(idFromChannelResponseData)

  function idFromChannelResponseData(responseData) {
    return responseData._id
  }
}


const assertResponseOK = response => {
  if (response.status !== 200)
    throw new Error('Expected response status to have been 200 but was ' + response.status)
  return response
}

function parseResponseJSON(response) {
  return response.json()
} 
