/* eslint-disable no-console */
require("dotenv").config({})
const twitch = require(".")
const fetch = require("node-fetch")
const WebSocket = require("isomorphic-ws")

const origins = {
  dev: "http://localhost:3000",
  staging: "https://maximumsheep-web-backend-staging.now.sh",
  production: "https://maximumsheep-web-backend-production.now.sh"
}

const getChannelId = twitch.getChannelId.bind(
  null,
  fetch,
  origins.staging,
  process.env.BRIDGE_SECRET_STAGING
)

const getAccessToken = twitch.getAccessToken.bind(
  null,
  fetch,
  origins.staging,
  process.env.BRIDGE_SECRET_STAGING
)

const subscribeToTwitch = twitch.subscribeToTwitch.bind(null, WebSocket)

;(async function tryChannelId() {
  const channelId = await getChannelId()
  console.log("got channel id", channelId)
})
;(async function trySubscribeToTwitch() {
  const topicName = "channel-subscribe-events-v1"
  const accessToken = await getAccessToken()
  const channelId = await getChannelId()
  console.log("channelId", channelId)
  const { onSubGift } = subscribeToTwitch(topicName, channelId, accessToken)
  onSubGift(gift => {
     console.log('gift', gift)
  })
})()

/*
Following is an example of a sub/resub message:
Note: The months field is deprecated. We now have fields for cumulative-months and streak-months.

{
   "type": "MESSAGE",
   "data": {
      "topic": "channel-subscribe-events-v1.44322889",
      "message": {
         "user_name": "dallas",
         "display_name": "dallas",
         "channel_name": "twitch",
         "user_id": "44322889",
         "channel_id": "12826",
         "time": "2015-12-19T16:39:57-08:00",
         "sub_plan": "Prime"/"1000"/"2000"/"3000",
         "sub_plan_name": "Channel Subscription (mr_woodchuck)",
         "cumulative-months": 9;
         "streak-months": 3,
         "context": "sub"/"resub",
         "sub_message": {
            "message": "A Twitch baby is born! KappaHD",
            "emotes": [
            {
               "start": 23,
               "end": 7,
               "id": 2867
            }]
         }
     }
   }
}*/

/*
Subgift example
{
   "type": "MESSAGE",
   "data": {
      "topic": "channel-subscribe-events-v1.44322889",
      "message": {
         "user_name": "dallas",
         "display_name": "dallas",
         "channel_name": "twitch",
         "user_id": "44322889",
         "channel_id": "12826",
         "time": "2015-12-19T16:39:57-08:00",
         "sub_plan": "1000"/"2000"/"3000",
         "sub_plan_name": "Channel Subscription (mr_woodchuck)",
         "months": 9,
         "context": "subgift",
         "sub_message": {
            "message": "",
            "emotes": null },
         "recipient_id": "13405587",
         "recipient_user_name": "tww2",
         "recipient_display_name": "TWW2",
         }
      }
   }
}*/

/*{
  "type": "MESSAGE",
  "data": {
     "topic": "channel-subscribe-events-v1.44322889",
     "message": {
        "channel_name": "twitch",
        "channel_id": "12826",
        "time": "2015-12-19T16:39:57-08:00",
        "sub_plan": "1000"/"2000"/"3000",
        "sub_plan_name": "Channel Subscription (mr_woodchuck)",
        "months": 9,
        "context": "anonsubgift",
        "sub_message": {
           "message": "",
           "emotes": null },
        "recipient_id": "13405587",
        "recipient_user_name": "tww2",
        "recipient_display_name": "TWW2",
        }
     }
  }
}
*/

// Sent on sub
//{"type":"RESPONSE","error":"","nonce":""}

// Sent from client to server, must send every 5 minutes
/*
{
  "type": "PING"
}*/

// Sent from server to client in response to a PING
/*{
  "type": "PONG"
}*/
