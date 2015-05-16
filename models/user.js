var mongodb = require('./db');
var test = require('assert');

function User(user) {
  this.name = user.name;
  this.password = user.password;
};
module.exports = User;

User.prototype.save = function save(callback) {
  var user = new User(this);
  mongodb.open(function(err, db) {
    test.equal(null, err);
    db.collection('users', function(err, collection) {
      test.equal(null, err);
      collection.ensureIndex({ name: 1 }, { unique: true }, function(err, result) {
        test.equal(null, err);
        collection.insertOne(user, { safe: true }, function(err, result) {
          test.equal(null, err);
          db.close();
          callback(err, result);
        });
      });
    });
  });
};

User.get = function get(username, callback) {
  mongodb.open(function(err, db) {
    test.equal(null, err);
    db.collection('users', function(err, collection) {
      test.equal(null, err);
      collection.findOne({ name: username }, function(err, doc) {
        test.equal(null, err);
        db.close();
        if (doc) {
          var user = new User(doc);
          callback(err, user);
        } else {
          callback(err, null);
        }
      });
    });
  });
};
