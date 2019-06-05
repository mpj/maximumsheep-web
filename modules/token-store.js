
exports.persistRefreshToken = function(datastore, refreshToken) {  
  return datastore.save({
    key: tokenVaultKey(datastore),
    data: {
      refreshToken
    },
  })
}

exports.retriveRefreshToken = async function (datastore) {
  const docs = await datastore.get(tokenVaultKey(datastore))
  return docs[0].refreshToken
}

function tokenVaultKey(datastore) {
  return datastore.key([ 'State', 'tokenVault' ])
}
