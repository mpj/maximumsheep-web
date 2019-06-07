
exports.saveRefreshToken = (MongoClient, uri, dbName, token) => 
  connected(MongoClient, uri, client => 
    client.db(dbName).collection(COLLECTION_NAME)
      .updateOne(
        { label: LABEL_NAME },
        { $set: { 'value': token } },
        { upsert: true }
      ))  

exports.loadRefreshToken = async (MongoClient, uri, dbName, token) => {
  let doc = await connected(MongoClient, uri, client => 
    client.db(dbName).collection(COLLECTION_NAME).findOne({ label: LABEL_NAME }))
  return doc.value
}
  
const COLLECTION_NAME = 'state'
const LABEL_NAME = 'refreshToken'
      

async function connected (MongoClient, uri, callback) {
  const client = new MongoClient(uri, { useNewUrlParser: true })
  let result
  try {
    await client.connect()
    result = await callback(client)
    await client.close()
    return result
  } catch (err) {
    await client.close()
    throw err
  }
}