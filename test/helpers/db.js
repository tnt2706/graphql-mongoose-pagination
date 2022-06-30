const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const mongoServer = new MongoMemoryServer();

function connectDatabase() {
  return new Promise((resolve, reject) => {
    mongoServer
      .getUri()
      .then(mongoUri => {
        mongoose.connect(mongoUri, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
        });
        mongoose.connection
          .once('open', async () => {
            resolve();
          })
          .on('error', error => {
            reject(error);
          });
      });
  });
}

async function disconnectDatabase() {
  return Promise.all([
    mongoServer.stop(),
    mongoose.disconnect(),
  ]);
}

module.exports = {
  connectDatabase,
  disconnectDatabase,
};
