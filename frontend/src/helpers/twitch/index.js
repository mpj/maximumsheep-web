module.exports.getChannelId = async function getChannelId(
  fetch,
  origin,
  secret
) {
  const url = origin + "/channel-id"
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ secret })
  })
  if (response.status !== 200) {
    throw new Error(
      "Response status was not okay (secret was probably incorrect)"
    )
  }
  return response.text()
}

module.exports.getAccessToken = async function getAccessToken(
  fetch,
  origin,
  secret
) {
  const response = await fetch(origin + "/request-token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ secret })
  })
  if (response.status !== 200) {
    throw new Error(
      "Response status was not okay (secret was probably incorrect)"
    )
  }
  return response.text()
}

module.exports.subscribeToTwitch = function subscribeToTwitch(
  WebSocket,
  topicName,
  channelId,
  oAuthAccessToken,
  callback
) {

  let onNewSubscriberHandler
  const socket = new WebSocket("wss://pubsub-edge.twitch.tv")

  socket.on("open", function open() {
    socket.send(
      JSON.stringify({
        type: "LISTEN",
        data: {
          topics: [ topicName + "." + channelId ],
          auth_token: oAuthAccessToken
        }
      })
    )

    setInterval(() => {
      socket.send(JSON.stringify({ "type": "PING" }))
    }, 30000);
  })

  socket.on("message", function(payload) {
    callback(payload)
    if(payload.type === 'MESSAGE') {
      const messageData = JSON.parse(payload.data.message)
      onNewSubscriberHandler({
        displayName: messageData.display_name
      })
    }
  })

  return {
    cancel() {
      socket.terminate()
    },
    onNewSubscriber(handler) {
      onNewSubscriberHandler = handler
    }
  }
}
