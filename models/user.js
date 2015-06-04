var mongodb = require('./db');
var Model = require('./model');
var test = require('assert');

function User(user) {
  this.name = (user.name)? user.name: '';
  this.password = (user.password)? user.password: '';
  this.isAdmin = (user.isAdmin)? Boolean(user.isAdmin): false;
  this.solved = (user.solved)? user.solved: {};
  this.tried = (user.tried)? user.tried: {};
};
module.exports = User;

User.prototype.save = function save(callback) {
  var user = new User(this);
  mongodb.collection('users', function(err, collection) {
    test.equal(null, err);
    collection.ensureIndex({ name: 1 }, { unique: true }, function(err, result) {
      test.equal(null, err);
      collection.insertOne(user, { safe: true }, function(err, result) {
        test.equal(null, err);
        callback(err, result);
      });
    });
  });
};

User.prototype.update = Model.update(User, 'users', 'name');
User.get = Model.get(User, 'users', 'name');
User.count = Model.count('users');
