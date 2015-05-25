var mongodb = require('./db');
var test = require('assert');

function Solution(sol) {
  this.code = (sol.code)? sol.code: '';
  this.lang = (sol.lang)? sol.lang: 'c';
  this.user = (sol.user)? sol.user: '';
  this.pid = (sol.pid)? Number(sol.pid): 1000;
  this.date = (sol.date)? sol.date: new Date();
  this.codeLength = (sol.codeLength)? sol.codeLength: sol.code.length;
};
module.exports = Solution;

Solution.prototype.save = function save(callback) {
  var solution = new Solution(this);
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

Solution.prototype.update = function update() {
  var newSol = new Solution(this);
  Solution.get(newSol.pid, function(err, sol) {
    test.equal(null, err);
    var diff = {};
    for (var key in sol) {
      if (newSol[key] != sol[key])
        diff[key] = newSol[key];
    }
    if (!diff) return;
    mongodb.open(function(err, db) {
      test.equal(null, err);
      db.collection('solutions', function(err, collection) {
        test.equal(null, err);
        collection.findOneAndUpdate({ sid: sol.sid }, { $set: diff }, function(err) {
          test.equal(null, err);
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
          var sol = new Solution(doc);
          callback(err, sol);
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
      collection.find({}, { code: false }).sort({ sid: -1 }).
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
