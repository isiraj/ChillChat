var pg = require('pg');
var postgresUrl = 'postgres://localhost/twitter_db';
var client = new pg.Client(postgresUrl);

client.connect();

module.exports = client;