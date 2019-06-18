let msg= {"type":"MESSAGE","data":{"topic":"channel-subscribe-events-v1.119879569","message":"{\"user_name\":\"twitchtester7182672\",\"display_name\":\"twitchtester7182672\",\"channel_name\":\"funfunfunction\",\"user_id\":\"427163740\",\"channel_id\":\"119879569\",\"recipient_id\":\"75461513\",\"recipient_user_name\":\"dral_khogo\",\"recipient_display_name\":\"Dral_Khogo\",\"time\":\"2019-06-12T14:33:44.059872531Z\",\"sub_message\":{\"message\":\"\",\"emotes\":null},\"sub_plan\":\"1000\",\"sub_plan_name\":\"Channel Subscription (funfunfunction)\",\"months\":1,\"context\":\"subgift\"}"}}
let parsed = JSON.parse(msg.data.message)

JSON.stringify(parsed, null, 2) //?





























//"{"displayName":"twitchtester7182672","streakMonths":1,"subscriptionPlan":"1000","isReSub":"resub","message":{"body":"","emotes":null}}"