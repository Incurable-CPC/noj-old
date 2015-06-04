var STATUS = require('../common').STATUS;
var Problem = require('./problem');
var Model = require('./model');
var User = require('./user');
var exec = require('child_process').exec;
var mkdirp = require('mkdirp');
var mongodb = require('./db');
var test = require('assert');
var path = require('path');
var fs = require('fs');

function Solution(sol) {
  this.sid = (sol.sid)? sol.sid: 100000;
  this.code = (sol.code)? sol.code: '';
  this.lang = (sol.lang)? sol.lang: 'c';
  this.user = (sol.user)? sol.user: '';
  this.pid = (sol.pid)? Number(sol.pid): 1000;
  this.date = (sol.date)? new Date(sol.date): new Date();
  this.codeLength = (sol.codeLength)? sol.codeLength: this.code.length;
  this.result = (sol.result)? Number(sol.result): 0;
  this.timeUsage = (sol.timeUsage)? sol.timeUsage: '---';
  this.memoryUsage = (sol.memoryUsage)? sol.memoryUsage: '---';
};
module.exports = Solution;

Solution.prototype.save = function save(callback) {
  var solution = new Solution(this);
  mongodb.collection('solutions', function(err, collection) {
    test.equal(null, err);
    collection.ensureIndex({ sid: -1 }, { unique: true }, function(err, result) {
      test.equal(null, err);
      collection.findOne({}, { sort: [[ 'sid', -1 ]], returnKey: true }, function (err, sol) {
        solution.sid = (sol)? sol.sid+1: 100000;
        collection.insertOne(solution, { safe: true }, function(err, result) {
          test.equal(null, err);
          solution.judge();
          callback(err, result);
        });
      });
    });
  });
};

Solution.prototype.update = Model.update(Solution, 'solutions', 'sid');
Solution.get = Model.get(Solution, 'solutions', 'sid');
Solution.count = Model.count('solutions');

Solution.getList = function getList(option, callback) {
  if (!option.cond) option.cond = {};
  if (!option.sortKey) option.sortKey = { sid: -1 };
  mongodb.collection('solutions', function(err, collection) {
    test.equal(null, err);
    collection.find(option.cond, { code: false }).sort(option.sortKey).
      skip(option.num*(option.page-1)).limit(option.num).toArray(function(err, docs) {
      test.equal(null, err);
      if (docs) {
        callback(err, docs.map(function(doc) {
          return new Solution(doc);
        }));
      } else {
        callback(err, null);
      }
    });
  });
};

Solution.prototype.judge = function judge() {
  var sol = new Solution(this);
  var dir = path.join('sandbox', String(sol.sid));
  User.get(sol.user, function(err, user) {
    test.equal(null, err);
    Problem.get(sol.pid, function(err, pro) {
      test.equal(null, err);
      pro.submit++;
      user.tried[sol.pid] = true;
      mkdirp(dir, function(err) {
        test.equal(null, err);
        fs.writeFile(path.join(dir, 'Main.cpp'), sol.code, function(err) {
          test.equal(null, err);
          exec('./sandbox/compile 1 '+sol.sid, function(err, stdout, stderr) {
            if (stdout.charAt(0) == '0') {
              sol.result = STATUS.RI;
              sol.update(function(err) {
                exec( './sandbox/judge '+sol.sid+' '+sol.pid+' '+
                     pro.timeLimit+' '+pro.memoryLimit+' '+pro.testdataNum, function(err, stdout, stderr) {
                  var result = stdout.split(/\r?\n/);
                  sol.result = Number(result[0]);
                  sol.timeUsage = result[1]+' ms';
                  sol.memoryUsage = result[2]+' KB';
                  sol.update();
                  if (sol.result == STATUS.AC) {
                    pro.accepted++;
                    user.solved[sol.pid] = true;
                  }
                  pro.update();
                  user.update();
                });
              });
            } else {
              sol.result = STATUS.CE;
              sol.update();
              pro.update();
              user.update();
            }
          });
        });
      });
    });
  });
};

