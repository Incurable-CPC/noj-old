var mongodb = require('./db');
var test = require('assert');
var Model = function(Item, collectionName, index) {
  this.Item = Item;
  this.collectionName = collectionName;
  this.index = index;
};
module.exports = Model;

Model.prototype.update = function update() {
  var cond = {};
  var model = this;
  return function update(callback) {
    var newItem = new model.Item(this);
    cond[model.index] = newItem[model.index];
    model.Item.get(newItem[model.index], function(err, item) {
      test.equal(null, err);
      var diff = {};
      for (var key in newItem) {
        if (newItem[key] != item[key])
          diff[key] = newItem[key];
      }
      if (!diff) return;
      mongodb.collection(model.collectionName, function(err, collection) {
        test.equal(null, err);
        collection.findOneAndUpdate(cond, { $set: diff }, function(err) {
          test.equal(null, err);
          if (callback) callback(err, newItem);
        });
      });
    });
  }
};

Model.prototype.get = function get() {
  var cond = {};
  var model = this;
  return function get(val, callback) {
    cond[model.index] = val;
    mongodb.collection(model.collectionName, function(err, collection) {
      test.equal(null, err);
      collection.findOne(cond, function(err, doc) {
        test.equal(null, err);
        if (doc) {
          callback(err, new model.Item(doc));
        } else {
          callback(err, null);
        }
      });
    });
  };
};

Model.prototype.getList = function getList(defaultSortKey, returnVal) {
  var model = this;
  return function getList(option, callback) {
    if (!option.cond) option.cond = {};
    if (!option.sortKey) option.sortKey = defaultSortKey;
    mongodb.collection(model.collectionName, function(err, collection) {
      test.equal(null, err);
      collection.find(option.cond, returnVal).sort(option.sortKey).
        skip(option.num*(option.page-1)).limit(option.num).toArray(function(err, docs) {
        test.equal(null, err);
        if (docs) {
          callback(err, docs.map(function(doc) {
            return new model.Item(doc);
          }));
        } else {
          callback(err, null);
        }
      });
    });
  };
};

Model.prototype.count = function count() {
  var model = this;
  return function count(cond, callback) {
    mongodb.collection(model.collectionName, function(err, collection) {
      test.equal(null, err);
      collection.count(cond, callback);
    });
  };
};
