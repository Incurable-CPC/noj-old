var STATUS = require('../common').STATUS;
var Model = require('./model');
var mongodb = require('./db');
var mkdirp = require('mkdirp');
var test = require('assert');
var path = require('path');
var fs = require('fs');

function Problem(pro) {
  this.pid = (pro.pid)? pro.pid: 1000;
  this.title = (pro.title)? pro.title: '';
  this.timeLimit = (pro.timeLimit)? Number(pro.timeLimit): 1000;
  this.memoryLimit = (pro.memoryLimit)? Number(pro.memoryLimit): 256;
  this.description = (pro.description)? pro.description: '';
  this.input = (pro.input)? pro.input: '';
  this.output = (pro.output)? pro.output: '';
  this.sampleInput = (pro.sampleInput)? pro.sampleInput: '';
  this.sampleOutput = (pro.sampleOutput)? pro.sampleOutput: '';
  this.source = (pro.source)? pro.source: '';
  this.hint = (pro.hint)? pro.hint: '';
  this.testdataNum = (pro.testdataNum)? Number(pro.testdataNum): 0;
  this.submit = (pro.submit)? Number(pro.submit): 0;
  this.accepted = (pro.accepted)? Number(pro.accepted): 0;
};
module.exports = Problem;

Problem.prototype.save = function save(callback) {
  var problem = new Problem(this);
  mongodb.collection('problems', function(err, collection) {
    test.equal(null, err);
    collection.ensureIndex({ pid: 1 }, { unique: true }, function(err, result) {
      test.equal(null, err);
      collection.findOne({}, { sort: [[ 'pid', -1 ]], returnKey: true }, function (err, pro) {
        problem.pid = (pro)? pro.pid+1: 1000;
        collection.insertOne(problem, { safe: true }, function(err, result) {
          test.equal(null, err);
          callback(err, problem);
        });
      });
    });
  });
};

Problem.prototype.update = Model.update(Problem, 'problems', 'pid');
Problem.get = Model.get(Problem, 'problems', 'pid');

Problem.getList = function getList(page, callback) {
  mongodb.collection('problems', function(err, collection) {
    test.equal(null, err);
    collection.find({ pid: {
      $gte: 950+page*50,
      $lt: 1000+page*50
    } }, { pid: 1, title: 1, submit: 1, accepted: 1}).toArray(function(err, docs) {
      test.equal(null, err);
      if (docs) {
        callback(err, docs.map(function(doc) {
          return new Problem(doc);
        }));
      } else {
        callback(err, null);
      }
    });
  });
};

Problem.prototype.addTestdata = function addTestdata(testdata, callback) {
  var pro = new Problem(this);
  var tmp = {};
  var datafiles = [];
  if (!testdata) { callback(); return; }
  testdata.forEach(function(file) {
    var name = file.originalname;
    name = name.slice(0, name.lastIndexOf('.'));
    if (!tmp[name]) tmp[name] = {};
    tmp[name][file.extension] = file.name;
    if ((tmp[name].in)&&(tmp[name].out))
      datafiles.push(tmp[name]);
  });
  this.testdataNum += datafiles.length;
  this.update();
  if (!datafiles) { callback(); return; }
  var dir = path.join('sandbox', 'testdata', String(pro.pid));
  mkdirp(dir, function(err) {
    test.equal(null, err);
    var cnt = 0;
    datafiles.forEach(function(datafile, i) {
      var id = i+pro.testdataNum
      var file = path.join(dir, 'testdata'+id);
      Object.keys(datafile).forEach(function(type) {
        fs.readFile(path.join('tmp', datafile[type]), function(err, data) {
          test.equal(null, err);
          fs.writeFile(file+'.'+type, data, function(err) {
            test.equal(null, err);
            cnt++;
            if (cnt == 2*datafiles.length) callback(err);
          });
        });
      });
    });
  });
};

Problem.prototype.getStatistics = function getStatistics(page, callback) {
  var pro = new Problem(this);
  var Solution = require('./solution');
  var User = require('./user');
  Solution.getList({
    num: 20, page: page,
    cond: { result: STATUS.AC, pid: pro.pid },
    sortKey: { codeLength : 1 }
  }, function(err, solList) {
    test.equal(null, err);
    pro.solList = solList;
    pro.result = [];
    var cnt = 0;
    var query = {};
    query['tried.'+pro.pid] = true;
    User.count(query, function(err, res) {
      pro.userTried = res;
      query = {};
      query['solved.'+pro.pid] = true;
      User.count(query, function(err, res) {
        pro.userSolved = res;
        Object.keys(STATUS).forEach(function(key, index) {
          Solution.count({ pid: pro.pid, result: index }, function(err, res) {
            cnt++;
            pro.result[index] = res;
            if (cnt == Object.keys(STATUS).length) {
              callback(err, pro);
            }
          });
        });
      });
    });
  });
}
