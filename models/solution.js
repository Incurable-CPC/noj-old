var mongodb = require('./db');
var test = require('assert');

function Solution(sol) {
  this.code = sol.code;
  this.lang = sol.lang;
  this.user = sol.user;
  this.pid = sol.pid;
};
module.exports = Solution;

Solution.prototype.save = function save(callback) {
  var solution = new Solution(this);
  solution.date = new Date().format('yyyy-MM-dd hh:mm:ss');
  mongodb.open(function(err, db) {
    test.equal(null, err);
    db.collection('solutions', function(err, collection) {
      test.equal(null, err);
      collection.ensureIndex({ sid: -1 }, { unique: true }, function(err, result) {
        test.equal(null, err);
        collection.findOne({}, { sort: [[ 'sid', -1 ]], returnKey: true }, function (err, sol) {
          solution.sid = (sol)? sol.sid+1: 100000;
          collection.insertOne(solution, { safe: true }, function(err, result) {
            test.equal(null, err);
            db.close();
            callback(err, result);
          });
        });
      });
    });
  });
};

Solution.get = function get(sid, callback) {
  mongodb.open(function(err, db) {
    test.equal(null, err);
    db.collection('solutions', function(err, collection) {
      test.equal(null, err);
      collection.findOne({ sid: Number(sid) }, function(err, doc) {
        test.equal(null, err);
        db.close();
        if (doc) {
          callback(err, doc);
        } else {
          callback(err, null);
        }
      });
    });
  });
}

Solution.getList = function getList(page, callback) {
  mongodb.open(function(err, db) {
    test.equal(null, err);
    db.collection('solutions', function(err, collection) {
      test.equal(null, err);
      collection.find().sort({ sid: -1 }).
        skip(50*(page-1)).limit(50).toArray(function(err, docs) {
        test.equal(null, err);
        db.close();
        if (docs) {
          callback(err, docs);
        } else {
          callback(err, null);
        }
      });
    });
  });
};
