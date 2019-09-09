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
      jest.useFakeTimers()
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
      subscribeToTwitch()
      expect(socketConstructedWithUrl).toBe("wss://pubsub-edge.twitch.tv")
    })

    it("sends listenting message after it sees socket is open", () => {
      subscribeToTwitch()
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

    describe("handlers", () => {
      let onNewSubscriberHandlerGotPayload
      let onSubGiftHandlerGotPayload
      let onResubscribeHandlerGotPayload
      let onAnonSubcriptionHandlerGotPayload
      let onErrorHandlerGotPayload
      beforeEach(() => {
        onNewSubscriberHandlerGotPayload = null
        onSubGiftHandlerGotPayload = null
        onResubscribeHandlerGotPayload = null
        onAnonSubcriptionHandlerGotPayload = null
        onErrorHandlerGotPayload = null

        const {
          onNewSubscriber,
          onResubscribe,
          onSubGift,
          onAnonSubGift,
          onError
        } = subscribeToTwitch()

        onNewSubscriber(payload => {
          onNewSubscriberHandlerGotPayload = payload
        })
        onSubGift(payload => {
          onSubGiftHandlerGotPayload = payload
        })
        onResubscribe(payload => {
          onResubscribeHandlerGotPayload = payload
        })
        onAnonSubGift(payload => {
          onAnonSubcriptionHandlerGotPayload = payload
        })
        onError(payload => {
          onErrorHandlerGotPayload = payload
        })

        onAnonSubcriptionHandlerGotPayload
      })

      describe("given open event", () => {
        beforeEach(() => {
          givenEvent("open")
        })

        it("does NOT trigger handlers", () => {
          expect(onNewSubscriberHandlerGotPayload).toBe(null)
          expect(onResubscribeHandlerGotPayload).toBe(null)
          expect(onSubGiftHandlerGotPayload).toBe(null)
        })

        describe("given response event", () => {
          beforeEach(() => {
            givenEvent(
              "message",
              JSON.stringify({
                type: "RESPONSE",
                error: "",
                nonce: ""
              })
            )
          })

          it("does NOT trigger handlers", () => {
            expect(onNewSubscriberHandlerGotPayload).toBe(null)
            expect(onResubscribeHandlerGotPayload).toBe(null)
            expect(onSubGiftHandlerGotPayload).toBe(null)
            expect(onAnonSubcriptionHandlerGotPayload).toBe(null)
          })
        })

        describe("given sub event", () => {
          beforeEach(() => {
            givenEvent(
              "message",
              JSON.stringify({
                type: "MESSAGE",
                data: {
                  topic: "channel-subscribe-events-v1.119879569",
                  message: JSON.stringify({
                    display_name: "DoudeMan",
                    cumulative_months: 1,
                    context: "sub"
                  })
                }
              })
            )
          })

          it("calls onNewSubscriber handler with displayName", () => {
            expect(onNewSubscriberHandlerGotPayload.displayName).toBe(
              "DoudeMan"
            )
          })

          it("does NOT call onSubGift", () => {
            expect(onSubGiftHandlerGotPayload).toBe(null)
          })

          it("error if no pong within 10 seconds after ping", () => {
            ;(function givenPingHappened() {
              jest.advanceTimersByTime(30000)
            })()

            expect(onErrorHandlerGotPayload).toBe(null)
            jest.advanceTimersByTime(10000)
            expect(onErrorHandlerGotPayload).toEqual({
              type: "NO_PONG"
            })
          })

          it("do NOT error if pong is received after 9999 ms", () => {
            jest.advanceTimersByTime(30000)
            jest.advanceTimersByTime(9999)
            givenEvent(
              "message",
              JSON.stringify({
                type: "PONG"
              })
            )
            jest.advanceTimersByTime(1)
            expect(onErrorHandlerGotPayload).toBe(null)
          })

          it("after error: no second PING should be sent", () => {
            jest.advanceTimersByTime(60000)
            // no pong!!
            expect(webSocketInstance.send.mock.calls.length).toBe(2)
          })
        })

        describe("given resub event", () => {
          beforeEach(() => {
            givenEvent(
              "message",
              JSON.stringify({
                type: "MESSAGE",
                data: {
                  topic: "channel-subscribe-events-v1.119879569",
                  message: JSON.stringify({
                    display_name: "SomeGuy",
                    cumulative_months: 4,
                    context: "resub"
                  })
                }
              })
            )
          })

          it("forwards displayName", () => {
            expect(onResubscribeHandlerGotPayload.displayName).toBe("SomeGuy")
          })

          it("forwards cumulativeMonths", () => {
            expect(onResubscribeHandlerGotPayload.cumulativeMonths).toBe(4)
          })
        })

        describe("given reconnect event", () => {
          beforeEach(() => {
            givenEvent(
              "message",
              JSON.stringify({
                type: "RECONNECT"
              })
            )
          })

          it("calls error handler with correct error type", () =>
            expect(onErrorHandlerGotPayload).toEqual({
              type: "DISCONNECTED"
            }))
        })
      })

      describe("given someone gifts a sub to someone else", () => {
        beforeEach(() => {
          givenEvent(
            "message",
            JSON.stringify({
              type: "MESSAGE",
              data: {
                topic: "channel-subscribe-events-v1.119879569",
                message: JSON.stringify({
                  display_name: "funfunfunction",
                  recipient_display_name: "noopkat",
                  context: "subgift"
                  // Why no months? There is currently no way to gift more
                  // than one month in Twitch UI and I don't see them
                  // adding that - more fun to gift to many instead
                })
              }
            })
          )
        })

        it("calls onSubGift handler with displayName", () => {
          expect(onSubGiftHandlerGotPayload.displayName).toBe("funfunfunction")
        })

        it("calls onSubGift handler with recipientDisplayName", () => {
          expect(onSubGiftHandlerGotPayload.recipientDisplayName).toBe(
            "noopkat"
          )
        })

        it("does NOT call onNewSubscriber", () => {
          expect(onNewSubscriberHandlerGotPayload).toBe(null)
        })
      })

      describe("given an anoymous person gifts a sub to someone", () => {
        beforeEach(() => {
          givenEvent(
            "message",
            JSON.stringify({
              type: "MESSAGE",
              data: {
                topic: "channel-subscribe-events-v1.44322889",
                message: JSON.stringify({
                  context: "anonsubgift",
                  recipient_display_name: "TWW2"
                })
              }
            })
          )
        })

        it("calls onAnonSubGift with recipientDisplayName", () => {
          expect(onAnonSubcriptionHandlerGotPayload.recipientDisplayName).toBe(
            "TWW2"
          )
        })
      })
    })

    it("does not forward pongs", () => {
      const { onNewSubscriber } = subscribeToTwitch()
      let callbackGotPayload
      onNewSubscriber(payload => {
        callbackGotPayload = payload
      })
      givenEvent("open")
      givenEvent(
        "message",
        JSON.stringify({
          type: "PONG"
        })
      )
      expect(callbackGotPayload).toBeUndefined()
    })

    it("terminates the connection when calling cancel", () => {
      const { cancel } = subscribeToTwitch(() => {})
      expect(terminateWasCalled).toBeUndefined()
      cancel()
      expect(terminateWasCalled).toBe(true)
    })

    it("pings every 30 seconds", () => {
      subscribeToTwitch()
      givenEvent("open")
      expect(webSocketInstance.send.mock.calls.length).toBe(1)
      jest.advanceTimersByTime(29999)
      expect(webSocketInstance.send.mock.calls.length).toBe(1)
      jest.advanceTimersByTime(1)
      expect(webSocketInstance.send.mock.calls.length).toBe(2)
      expect(JSON.parse(webSocketInstance.send.mock.calls[1]).type).toBe("PING")
    })

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
