require("dotenv").config({})
const twitch = require(".")
const fetch = require("node-fetch")

const origins = {
  dev: "http://localhost:3001",
  staging: "https://maximumsheep-web-backend-staging.now.sh/",
  production: "https://maximumsheep-web-backend-production.now.sh/"
}

const getChannelId = twitch.getChannelId.bind(
  null,
  fetch,
  origins.staging,
  process.env.BRIDGE_SECRET_STAGING
)

;(async function() {
  const channelId = await getChannelId()
  // eslint-disable-next-line no-console
  console.log("got channel id", channelId)
})()
