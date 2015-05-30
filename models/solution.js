var Problem = require('./problem');
var mongodb = require('./db');
var test = require('assert');

Solution.status = [
  'Pending',
  'Pending Rejudging',
  'Compiling',
  'Running & Judging',
  'Accepted',
  'Presentation Error',
  'Wrong Answer',
  'Time Limit Exceed',
  'Memory Limit Exceed',
  'Output Limit Exceed',
  'Runtime Error',
  'Compile Error',
  'Compile OK',
  'Test Running Done'
];

const STATUS_WT0 = 0
const STATUS_WT1 = 1
const STATUS_CI = 2
const STATUS_RI = 3
const STATUS_AC = 4
const STATUS_PE = 5
const STATUS_WA = 6
const STATUS_TLE = 7
const STATUS_MLE = 8
const STATUS_OLE = 9
const STATUS_RE = 10
const STATUS_CE = 11
const STATUS_CO = 12
const STATUS_TR = 13

function Solution(sol) {
  this.sid = (sol.sid)? sol.sid: 100000;
  this.code = (sol.code)? sol.code: '';
  this.lang = (sol.lang)? sol.lang: 'c';
  this.user = (sol.user)? sol.user: '';
  this.pid = (sol.pid)? Number(sol.pid): 1000;
  this.date = (sol.date)? sol.date: new Date();
  this.codeLength = (sol.codeLength)? sol.codeLength: sol.code.length;
  this.result = (sol.result)? Number(sol.result): 0;
  this.timeUsage = (sol.timeUsage)? Number(sol.timeUsage): '---';
  this.memoryUsage = (sol.memoryUsage)? Number(sol.memoryUsage): '---';
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
            solution.judge();
            db.close();
            callback(err, result);
          });
        });
      });
    });
  });
};

Solution.prototype.update = function update(callback) {
  var newSol = new Solution(this);
  Solution.get(newSol.sid, function(err, sol) {
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
          if (callback) callback(err);
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

Solution.prototype.judge = function judge() {
  var exec = require('child_process').exec;
  var mkdirp = require('mkdirp');
  var path = require('path');
  var fs = require('fs');

  var sol = new Solution(this);
  var dir = path.join('sandbox', String(sol.sid));
  mkdirp(dir, function(err) {
    test.equal(null, err);
    fs.writeFile(path.join(dir, 'Main.cpp'), sol.code, function(err) {
      test.equal(null, err);
      exec('./sandbox/compile 1 '+sol.sid, function(err, stdout, stderr) {
        if (stdout.charAt(0) == '0') {
          sol.result = STATUS_RI;
          sol.update(function(err) {
            Problem.get(sol.pid, function(err, pro) {
              exec( './sandbox/judge '+sol.sid+' '+sol.pid+' '+
                   pro.timeLimit+' '+pro.memoryLimit+' '+pro.testdataNum, function(err, stdout, stderr) {
                var result = stdout.split(/\r?\n/);
                sol.result = Number(result[0]);
                sol.timeUsage = result[1]+' ms';
                sol.memoryUsage = result[2]+' KB';
                sol.update();
              });
            });
          });
        } else {
          sol.result = STATUS_CE;
          sol.update();
        }
      });
    });
  });
};
