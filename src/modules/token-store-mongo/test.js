const tokenStore = require("./")

/* eslint-disable no-unused-vars */

describe('token-store-mongo', () => {
  let saveRefreshToken
  let loadRefreshToken
  
  let clientCreatedWithUri
  let clientCreatedWithOpts
  let connectWasCalled
  let closeWasCalled
  let dbCalledWithName
  let collectionCalledWithName 
  let updateOneCalledWithFilter
  let updateOneCalledWithUpdate
  let updateOneCalledWithOptions
  class MongoClient {
    constructor(uri, opts) {
      clientCreatedWithUri = uri
      clientCreatedWithOpts = opts
    }
    async connect() {
      connectWasCalled = true
    }
    db(name) {
      dbCalledWithName = name
      return {
        collection: name => {
          collectionCalledWithName = name
          return {
            updateOne: async (filter, update, options) => {
              updateOneCalledWithFilter = filter
              updateOneCalledWithUpdate = update
              updateOneCalledWithOptions = options
            }
          }
        }
      }
    }
    async close() {
      closeWasCalled = true
    }
  }
  
  beforeEach(() => {
    clientCreatedWithUri = null
    clientCreatedWithOpts = null
    connectWasCalled = false
    closeWasCalled = false
    dbCalledWithName = null
    collectionCalledWithName = null
    updateOneCalledWithFilter  = null
    updateOneCalledWithUpdate = null
    updateOneCalledWithOptions = null
    saveRefreshToken = tokenStore.saveRefreshToken.bind(
      null,
      MongoClient
    )
    loadRefreshToken = tokenStore.loadRefreshToken.bind(
      null,
      MongoClient
    )
  })

  describe('saveRefreshToken', () => {
    const someUri = 'mongodb://lololo'
    const someDbName = 'someDb'
    const someToken = 'someTokenSecret123'
    beforeEach(() => 
      saveRefreshToken(someUri, someDbName, someToken))
    
    it('passes url to client', () => 
      expect(clientCreatedWithUri).toBe(someUri))

    it('uses new url parser on client', () =>
      expect(clientCreatedWithOpts.useNewUrlParser).toBe(true))
    
    it('passes database name to client', () => 
      expect(dbCalledWithName).toBe(someDbName))
    
    it('uses collect collection name', () => 
      expect(collectionCalledWithName).toBe('state'))
    
    it('updates state with correct label', () => 
      expect(updateOneCalledWithFilter.label).toBe('refreshToken'))
    
    it('sets the state document value with token', () => 
      expect(updateOneCalledWithUpdate.$set.value).toBe(someToken))
    
    it('does the update as an upsert', () => 
      expect(updateOneCalledWithOptions.upsert).toBe(true))

  })
})
