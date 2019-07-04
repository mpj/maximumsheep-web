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


    it("formats subscription events to onTwitchSubscription", () => {
      const { onNewSubscriber, onSubGift } = subscribeToTwitch()
      let callbackGotPayload
      let onSubGiftWasCalled = false
      onNewSubscriber(payload => {
        callbackGotPayload = payload
      })
      onSubGift(() => {
        onSubGiftWasCalled = true
      })
      givenEvent("open")
      expect(callbackGotPayload).toBeUndefined()
      givenEvent("message", JSON.stringify({
        "type": "MESSAGE",
        "data": {
          "topic": "channel-subscribe-events-v1.119879569",
          "message": JSON.stringify({
            "display_name": "DoudeMan",
            "cumulative_months":1, 
            "context": "sub"
          })
        }
      }))
      expect(callbackGotPayload.displayName).toBe('DoudeMan')
      expect(callbackGotPayload.cumulativeMonths).toBe(1)
      expect(onSubGiftWasCalled).toBe(false)
    })

    it('format resub events for onTwitchSubscription', () => {
       const { onNewSubscriber, onSubGift } = subscribeToTwitch()
      let callbackGotPayload
      let onSubGiftWasCalled = false
      onNewSubscriber(payload => {
        callbackGotPayload = payload
      })
      onSubGift(() => {
        onSubGiftWasCalled = true
      })
      givenEvent("open")
      expect(callbackGotPayload).toBeUndefined()
      givenEvent("message", JSON.stringify({
        "type": "MESSAGE",
        "data": {
          "topic": "channel-subscribe-events-v1.119879569",
          "message": JSON.stringify({
            "display_name": "SomeGuy",
            "cumulative_months":4, 
            "context": "resub"
          })
        }
      }))
      expect(callbackGotPayload.displayName).toBe('SomeGuy')
      expect(callbackGotPayload.cumulativeMonths).toBe(4)
      expect(onSubGiftWasCalled).toBe(false)
    })

    describe('given someone gifts a sub to someone else', () => {
      let callbackGotPayload
      let onNewSubscriberWasCalled = false
      beforeEach(() => {
        const { onSubGift, onNewSubscriber } = subscribeToTwitch()
        onSubGift(payload => {
          callbackGotPayload = payload
        })
        onNewSubscriber(() => {
          onNewSubscriberWasCalled = true
        })
        givenEvent("message", JSON.stringify({
          "type": "MESSAGE",
            "data": {
              "topic": "channel-subscribe-events-v1.119879569",
              "message": JSON.stringify({
                "display_name": "funfunfunction",
                "recipient_display_name": "noopkat",
                "context": "subgift"
                // Why no months? There is currently no way to gift more
                // than one month in Twitch UI and I don't see them
                // adding that - more fun to gift to many instead
              })
            }
          }))
      })
      
      it('calls onSubGift handler with displayName', () => {
        expect(callbackGotPayload.displayName).toBe('funfunfunction')
      })

      it('calls onSubGift handler with recipientDisplayName', () => {
        expect(callbackGotPayload.recipientDisplayName).toBe('noopkat')
      })

      it('does NOT call onNewSubscriber', () => {
        expect(onNewSubscriberWasCalled).toBe(false)
      })

    })

    it("does not forward responses", () => {
      const { onNewSubscriber } = subscribeToTwitch()
      let callbackGotPayload
      onNewSubscriber(payload => {
        callbackGotPayload = payload
      })
      givenEvent("open")
      givenEvent("message", JSON.stringify({ 
        type: 'RESPONSE', 
        error: '', 
        nonce: '' 
      }))
      expect(callbackGotPayload).toBeUndefined()
    })

    it("does not forward pongs", () => {
      const { onNewSubscriber } = subscribeToTwitch()
      let callbackGotPayload
      onNewSubscriber(payload => {
        callbackGotPayload = payload
      })
      givenEvent("open")
      givenEvent("message", JSON.stringify({ 
        type: 'PONG', 
      }))
      expect(callbackGotPayload).toBeUndefined()
    })

    it("terminates the connection when calling cancel", () => {
      const { cancel } = subscribeToTwitch(() => {})
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
