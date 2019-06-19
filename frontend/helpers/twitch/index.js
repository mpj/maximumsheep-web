module.exports.getChannelId = async function getChannelId(
  fetch,
  origin,
  secret
) {
  const response = await fetch(origin + "/channel-id", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ secret })
  });
  if (response.status !== 200) {
    throw new Error(
      "Response status was not okay (secret was probably incorrect)"
    );
  }
  return response.text();
};
