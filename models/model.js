var mongodb = require('./db');
var test = require('assert');
var Model = {};
module.exports = Model;

Model.update = function update(Item, collectionName, index) {
  var cond = {};
  return function update(callback) {
    var newItem = new Item(this);
    cond[index] = newItem[index];
    Item.get(newItem[index], function(err, item) {
      test.equal(null, err);
      var diff = {};
      for (var key in newItem) {
        if (newItem[key] != item[key])
          diff[key] = newItem[key];
      }
      if (!diff) return;
      mongodb.collection(collectionName, function(err, collection) {
        test.equal(null, err);
        collection.findOneAndUpdate(cond, { $set: diff }, function(err) {
          test.equal(null, err);
          if (callback) callback(err);
        });
      });
    });
  }
};

Model.get = function get(Item, collectionName, index) {
  var cond = {};
  return function get(val, callback) {
    cond[index] = val;
    mongodb.collection(collectionName, function(err, collection) {
      test.equal(null, err);
      collection.findOne(cond, function(err, doc) {
        test.equal(null, err);
        if (doc) {
          callback(err, new Item(doc));
        } else {
          callback(err, null);
        }
      });
    });
  };
};

Model.count = function count(collectionName) {
  return function count(cond, callback) {
    mongodb.collection(collectionName, function(err, collection) {
      test.equal(null, err);
      collection.count(cond, callback);
    });
  };
};
