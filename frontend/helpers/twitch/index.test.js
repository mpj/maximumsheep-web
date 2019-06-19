const { getChannelId } = require('.')

describe('helpers/twitch', () => {
  describe('getChannelId', () => {
    let result
    let fetchYieldsResponse
    let fetchCalledWithUrl
    let fetchCalledWithOpts
    const fetch = (url, opts) => {
      fetchCalledWithUrl = url
      fetchCalledWithOpts = opts
      return Promise.resolve(fetchYieldsResponse)
    }

    describe('happy path', () => {
      beforeEach(async () => {
        fetchYieldsResponse = {
          status: 200,
          text: () => Promise.resolve(someChannelId)
        }
        result = await getChannelId(fetch, someOrigin, someSecret)
      })
  
      it('calls fetch with correct url', () =>
        expect(fetchCalledWithUrl).toBe(someOrigin + '/channel-id'))
  
      it('calls fetch with post', () => 
        expect(fetchCalledWithOpts.method).toBe('POST'))
  
      it('calls fetch with JSON headers', () =>
        expect(fetchCalledWithOpts.headers['Content-Type']).toBe('application/json'))
      
      it('passes secret as json', () => 
        expect(JSON.parse(fetchCalledWithOpts.body).secret).toBe(someSecret))    
  
      it('returns response text as result', () =>
        expect(result).toBe('someChannelId'))
    })

    describe('auth errors', () => {
      beforeEach(async () => {
        fetchYieldsResponse = {
          status: 401,
          text: () => Promise.resolve(someChannelId)
        }
      })

      it('throws error', () => 
        expect(getChannelId(fetch, someOrigin, someSecret))
          .rejects.toMatchObject({
            message: 'Response status was not okay (secret was probably incorrect)'
          }))
    })
    
  })

})

const someOrigin = 'https://myapp.com'
const someSecret = 'someSecret'
const someChannelId = 'someChannelId'