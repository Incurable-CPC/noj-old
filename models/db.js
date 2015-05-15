var settings = require('../settings');
var Server = require('mongodb').Server;
var Db = require('mongodb').Db;

var db = new Db(settings.db, new Server(settings.host, 27017));

module.exports = db;
