
exports.getChannelId = function getChannelId(fetch, clientId, oAuthAccessToken) {
  return fetch('https://api.twitch.tv/kraken/channel', {
    credentials: 'include',  
    headers: {
      'Client-ID': clientId,
      'Authorization': 'OAuth ' + oAuthAccessToken
    }
  })
  .then(assertResponseOK)
  .then(parseResponseJSON)
  .then(idFromChannelResponseData)

  function idFromChannelResponseData(responseData) {
    return responseData._id
  }
}
