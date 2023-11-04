const { MongoClient } = require("mongodb");

let dbConnection;
let uri =
  "mongodb+srv://herumb-venuelook:herumb123@testingCluster.yyfpket.mongodb.net/?retryWrites=true&w=majority";

module.exports = {
  connectToDb: (callBackFn) => {
    MongoClient.connect(uri)
      .then((client) => {
        dbConnection = client.db();
        return callBackFn();
      })
      .catch((err) => {
        console.log(err);
        return callBackFn(err);
      });
  },
  getDb: () => dbConnection,
};
