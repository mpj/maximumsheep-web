const twitch = require(".")

describe("helpers/twitch", () => {
  describe("getChannelId", () => {
    let result
    let fetchYieldsResponse
    let fetchCalledWithUrl
    let fetchCalledWithOpts
    const fetch = (url, opts) => {
      fetchCalledWithUrl = url
      fetchCalledWithOpts = opts
      return Promise.resolve(fetchYieldsResponse)
    }

    describe("happy path", () => {
      beforeEach(async () => {
        fetchYieldsResponse = {
          status: 200,
          text: () => Promise.resolve(someChannelId)
        }
        result = await twitch.getChannelId(fetch, someOrigin, someSecret)
      })

      it("calls fetch with correct url", () =>
        expect(fetchCalledWithUrl).toBe(someOrigin + "/channel-id"))

      it("calls fetch with post", () =>
        expect(fetchCalledWithOpts.method).toBe("POST"))

      it("calls fetch with JSON headers", () =>
        expect(fetchCalledWithOpts.headers["Content-Type"]).toBe(
          "application/json"
        ))

      it("passes secret as json", () =>
        expect(JSON.parse(fetchCalledWithOpts.body).secret).toBe(someSecret))

      it("returns response text as result", () =>
        expect(result).toBe("someChannelId"))
    })

    describe("auth errors", () => {
      beforeEach(async () => {
        fetchYieldsResponse = {
          status: 401,
          text: () => Promise.resolve(someChannelId)
        }
      })

      it("throws error", () =>
        expect(
          twitch.getChannelId(fetch, someOrigin, someSecret)
        ).rejects.toMatchObject({
          message:
            "Response status was not okay (secret was probably incorrect)"
        }))
    })
  })

  describe("subscribeToTwitch", () => {
    let WebSocket
    let socketConstructedWithUrl
    let givenEvent
    let terminateWasCalled
    let subscribeToTwitch
    let sendWasCalledWith
    let webSocketInstance = null
    
    beforeEach(() => {
      jest.useFakeTimers();
      let callbacks = {}
      givenEvent = (topic, data) => callbacks[topic](data)

      WebSocket = function(url) {
        expect(webSocketInstance).toBe(null)
        socketConstructedWithUrl = url
        this.on = function(topic, callback) {
          callbacks[topic] = callback
        }
        this.send = jest.fn(data => {
          sendWasCalledWith = data
        })
        this.terminate = () => {
          terminateWasCalled = true
        }
        webSocketInstance = this
      }

      subscribeToTwitch = twitch.subscribeToTwitch.bind(
        null,
        WebSocket,
        someTopic,
        someChannelId,
        someToken
      )
    })

    afterEach(() => {
      webSocketInstance = null
      jest.clearAllTimers()
    })

    it("uses correct twitch endpoint", () => {
      subscribeToTwitch(() => {})
      expect(socketConstructedWithUrl).toBe("wss://pubsub-edge.twitch.tv")
    })

    it("sends listenting message after it sees socket is open", () => {
      subscribeToTwitch(() => {})
      expect(sendWasCalledWith).toBeUndefined()
      givenEvent("open")
      expect(sendWasCalledWith).toBe(
        JSON.stringify({
          type: "LISTEN",
          data: {
            topics: [someTopic + "." + someChannelId],
            auth_token: someToken
          }
        })
      )
    })

    it("forwards payload to callback", () => {
      let callbackGotPayload
      subscribeToTwitch(payload => {
        callbackGotPayload = payload
      })
      givenEvent("open")
      expect(callbackGotPayload).toBeUndefined()
      givenEvent("message", somePayload)
      expect(callbackGotPayload).toBe(somePayload)
    })

    it("terminates the connection when calling cancel", () => {
      const cancel = subscribeToTwitch(() => {})
      expect(terminateWasCalled).toBeUndefined()
      cancel()
      expect(terminateWasCalled).toBe(true)
    })

    it("pings every 30 seconds", () => {
      subscribeToTwitch(() => { })
      givenEvent("open")
      expect(webSocketInstance.send.mock.calls.length).toBe(1)
      jest.advanceTimersByTime(29999)
      expect(webSocketInstance.send.mock.calls.length).toBe(1)
      jest.advanceTimersByTime(1)
      expect(webSocketInstance.send.mock.calls.length).toBe(2)
    })

    it.todo("handle pongs")
    it.todo("error if no pong")
    it.todo("fails if socket never opens")
    it.todo("refactor to generator")    
  })

 
  it.todo("test request token")
  it.todo("channelid endpoint should use token")
  
  
})

const someOrigin = "https://myapp.com"
const someSecret = "someSecret"
const someTopic = "someTopic"
const someChannelId = "someChannelId"
const someToken = "someToken"
const somePayload = JSON.stringify({
  type: "SOMEPAYLOADTYPE"
})
