var STATUS = require('../common').STATUS;
var Problem = require('./_problem');
var Model = require('./model');
var User = require('./_user');
var exec = require('child_process').exec;
var mkdirp = require('mkdirp');
var mongodb = require('./db');
var test = require('assert');
var path = require('path');
var fs = require('fs');

function Solution(sol) {
  this.sid = (sol.sid)? Number(sol.sid): 100000;
  this.code = (sol.code)? sol.code: '';
  this.lang = (sol.lang)? sol.lang: 'c';
  this.user = (sol.user)? sol.user: '';
  this.pid = (sol.pid)? Number(sol.pid): 1000;
  this.cid = (sol.cid)? Number(sol.cid): 0;
  this.date = (sol.date)? new Date(sol.date): new Date();
  this.codeLength = (sol.codeLength)? sol.codeLength: this.code.length;
  this.result = (sol.result)? Number(sol.result): STATUS.WT0;
  this.timeUsage = (sol.timeUsage)? sol.timeUsage: '---';
  this.memoryUsage = (sol.memoryUsage)? sol.memoryUsage: '---';
};
module.exports = Solution;

var solutionCnt;
Solution.init = function init(callback) {
  mongodb.collection('solutions', function(err, collection) {
    test.equal(null, err);
    collection.findOne({}, { sort: [[ 'sid', -1 ]], returnKey: true }, function (err, sol) {
      test.equal(null, err);
      solutionCnt = (sol)? sol.sid-99999: 0;
      if (callback) callback(err);
    });
  });
};

Solution.prototype.save = function save(callback) {
  var sol = new Solution(this);
  mongodb.collection('solutions', function(err, collection) {
    test.equal(null, err);
    collection.ensureIndex({ sid: -1 }, { unique: true }, function(err, result) {
      test.equal(null, err);
      sol.sid = solutionCnt+100000;
      solutionCnt++;
      collection.insertOne(sol, { safe: true }, function(err, result) {
        test.equal(null, err);
        sol.judge();
        callback(err, sol);
      });
    });
  });
};

var model = new Model(Solution, 'solutions', 'sid');
Solution.prototype.update = model.update();
Solution.get = model.get();
Solution.count = model.count();
Solution.getList = model.getList({ sid: -1 }, { code: false });

Solution.prototype.judge = function judge(callback) {
  var sol = new Solution(this);
  var dir = path.join('sandbox', 'submissions', String(sol.sid));
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
                  sol.update(callback);
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
              sol.update(callback);
              pro.update();
              user.update();
            }
          });
        });
      });
    });
  });
};

