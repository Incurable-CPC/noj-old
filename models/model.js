var mongodb = require('./db');
var test = require('assert');
var Model = function(Item, collectionName, index) {
  this.Item = Item;
  this.collectionName = collectionName;
  this.index = index;
};
module.exports = Model;

Model.prototype.get = function get() {
  var cond = {};
  var options = {};
  var model = this;
  return function get(val, callback, returnVal) {
    cond[model.index] = val;
    if (returnVal) options.fields = returnVal;
    mongodb.collection(model.collectionName, function(err, collection) {
      test.equal(null, err);
      collection.findOne(cond, options, function(err, doc) {
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
  return function getList(options, callback) {
    if (!options.cond) options.cond = {};
    if (!options.sortKey) options.sortKey = defaultSortKey;
    mongodb.collection(model.collectionName, function(err, collection) {
      test.equal(null, err);
      collection.find(option.cond, returnVal).sort(option.sortKey).
        skip(options.num*(options.page-1)).limit(options.num).toArray(function(err, docs) {
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
