// In this file you can configure migrate-mongo
const fs = require('fs');

const MONGO_INITDB_ROOT_USERNAME = fs.readFileSync(process.env.MONGO_INITDB_ROOT_USERNAME_FILE);
const MONGO_INITDB_ROOT_PASSWORD = fs.readFileSync(process.env.MONGO_INITDB_ROOT_PASSWORD_FILE);

const connectionString = 'mongodb://' +
    MONGO_INITDB_ROOT_USERNAME.toString() + ':' +
    MONGO_INITDB_ROOT_PASSWORD.toString() + '@' +
    'mongodb-service' + ':' + process.env.MONGO_DATABASE_PORT;

const config = {
  mongodb: {

    url: connectionString,

    databaseName: process.env.MONGO_DATABASE_NAME,

    options: {
      useNewUrlParser: true, // removes a deprecation warning when connecting
      useUnifiedTopology: true, // removes a deprecating warning when connecting
    }
  },

  // The migrations dir, can be an relative or absolute path. Only edit this when really necessary.
  migrationsDir: "migrations",

  // The mongodb collection where the applied changes are stored. Only edit this when really necessary.
  changelogCollectionName: "changelog",

  // The file extension to create migrations and search for in migration dir 
  migrationFileExtension: ".js",

  // Enable the algorithm to create a checksum of the file contents and use that in the comparison to determin
  // if the file should be run.  Requires that scripts are coded to be run multiple times.
  useFileHash: false
};

// Return the config as a promise
module.exports = config;
