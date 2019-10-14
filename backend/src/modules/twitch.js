const querystring = require("query-string")

exports.getTokensWithCode = (
  fetch,
  clientId,
  clientSecret,
  redirectURL,
  code
) =>
  fetch(
    "https://id.twitch.tv/oauth2/token?" +
      querystring.stringify({
        grant_type: "authorization_code",
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectURL,
        code
      }),
    { method: "POST" }
  )
    .then(assertResponseOK)
    .then(parseResponseJSON)
    .then(tokenSetFromResponseBody)

exports.getTokensWithRefreshToken = (
  fetch,
  clientId,
  clientSecret,
  refreshToken
) =>
  fetch(
    "https://id.twitch.tv/oauth2/token?" +
      querystring.stringify({
        grant_type: "refresh_token",
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken
      }),
    { method: "POST" }
  )
    .then(assertResponseOK)
    .then(parseResponseJSON)
    .then(tokenSetFromResponseBody)

exports.getLoginURL = function(clientId, redirectURL, scope) {
  return (
    "https://id.twitch.tv/oauth2/authorize" +
    "?" +
    querystring.stringify({
      response_type: "code",
      client_id: clientId,
      scope,
      redirect_uri: redirectURL
    })
  )
}

function tokenSetFromResponseBody(body) {
  if (
    !body.access_token ||
    !body.refresh_token ||
    !Number.isInteger(body.expires_in)
  ) {
    throw new Error("Response body cannot be parsed as token set")
  }
  return {
    expiresIn: body.expires_in,
    access: body.access_token,
    refresh: body.refresh_token
  }
}

exports.getChannelId = function getChannelId(
  fetch,
  clientId,
  oAuthAccessToken
) {
  return fetch("https://api.twitch.tv/kraken/channel", {
    credentials: "include",
    headers: {
      "Accept": "application/vnd.twitchtv.v5+json",
      "Client-ID": clientId,
      Authorization: "OAuth " + oAuthAccessToken
    }
  })
    .then(assertResponseOK)
    .then(parseResponseJSON)
    .then(idFromChannelResponseData)

  function idFromChannelResponseData(responseData) {
    return responseData._id
  }
}

const assertResponseOK = response => {
  if (response.status !== 200) {
    throw new Error(
      "Expected response status to have been 200 but was " + response.status
    )
  }
  return response
}

const parseResponseJSON = response => response.json()
