var mongodb = require('./db');
var Model = require('./model');
var test = require('assert');

function User(user) {
  this.name = (user.name)? user.name: '';
  this.password = (user.password)? user.password: '';
  this.isAdmin = Boolean(user.isAdmin);
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
        callback(err, user);
      });
    });
  });
};

var model = new Model(User, 'users', 'name');
User.prototype.update = model.update();
User.get = model.get();
User.count = model.count();
