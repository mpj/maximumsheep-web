const tokenStore = require('./index')

const { Datastore } = require('@google-cloud/datastore')
const datastore = new Datastore({
  projectId: 'twitch-token-bridge-test',
  keyFilename: './sandbox-credentials.json',
})

const persistRefreshToken = tokenStore.persistRefreshToken.bind(null, datastore)
const retrieveRefreshToken = tokenStore.retriveRefreshToken.bind(null, datastore)

;(async function() {
  const fakeToken = 'abc123'
  console.log('persisting token ' + fakeToken)
  await persistRefreshToken(fakeToken)
  const retrievedToken = await retrieveRefreshToken()
  console.log('got token', retrievedToken)
}()).catch(console.error)
