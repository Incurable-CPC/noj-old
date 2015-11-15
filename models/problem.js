/**
 * Created by Cai on 8/12/2015.
 */
var mongoose = require('mongoose');
var STATUS = require('../common').STATUS;
var Schema = mongoose.Schema;
var mkdirp = require('mkdirp');
var path = require('path');
var fs = require('fs');
var test = require('assert');

var problemSchema = new Schema({
  pid: { type: Number, index: { unique: true }},
  title: { type: String, default: '' },
  timeLimit: { type: Number, default: 1000 },
  memoryLimit: { type: Number, default: 256},
  description: { type: String, default: '' },
  input: { type: String, default: '' },
  output: { type: String, default: '' },
  sampleInput: { type: String, default: '' },
  sampleOutput: { type: String, default: '' },
  source: { type: String, default: '' },
  hint: { type: String, default: '' },
  testdataNum: { type: Number, default: 0 },
  submit:  { type: Number, default: 0 },
  accepted:  { type: Number, default: 0 },
  hidden: Boolean,
  specalJudge: Boolean
});

problemSchema.pre('save', function(next) {
  var pro = this;
  if (pro.pid) return;
  var Counter = mongoose.model('Counter');
  Counter.new('Problem', function (err, ret) {
    if (err) next(err);
    pro.pid = ret+1000;
    next();
  });
});

problemSchema.methods.addTestdata = function addTestdata(testdata, callback) {
  if (!testdata) return callback();
  var pro = this;
  var tmp = {};
  var files = [];
  testdata.forEach(function(file) {
    var name = file.originalname;
    name = name.slice(0, name.lastIndexOf('.'));
    if (!tmp[name]) tmp[name] = {};
    tmp[name][file.extension] = file.name;
    if ((tmp[name].in) && (tmp[name].out)) {
      files.push(tmp[name]);
    }
  });
  var dir = path.join('sandbox', 'testdata', String(this.pid));
  var testdataNum = this.testdataNum;
  Problem.findOneAndUpdate({ pid: pro.pid },
    {$inc: { testdataNum: files.length}}, function(err) {
      if (err) return callback(err);
      mkdirp(dir, function(err) {
        if (err) return callback(err);
        var cnt = 0;
        files.forEach(function(file, i) {
          var id = i+testdataNum;
          var filename = path.join(dir, 'data'+id);
          Object.keys(file).forEach(function (type) {
            var source = path.join('tmp', file[type]);
            fs.readFile(source, function (err, data) {
              if (err) callback(err);
              fs.writeFile(filename+'.'+type, data, function(err) {
                if (err) callback(err);
                cnt++;
                fs.unlink(source);
                if (cnt == 2*files.length) {
                  pro.rejudge();
                  callback(err, pro);
                }
              })
            });
          })
        })
      });
    });
};
problemSchema.methods.getStatistics = function getStatistics(page, callback) {
  var pro = this;
  var Solution = mongoose.model('Solution');
  var User = mongoose.model('User');
  Solution.find({ pid: pro.pid, result: STATUS.AC }, null, {
    limit: 20,
    skip: 20*(page-1),
    sort: { codeLength: 1 }}, function(err, solList) {
      if (err) return callback(err);
      pro.solList = solList;
      pro.result = [];
      var cnt = 0;
      var ret = function(err, pro) {
        cnt++;
        if (cnt == 2+Object.keys(STATUS).length) {
          callback(err, pro);
        }
      };
      User.count({ solved: pro.pid }, function(err, res) {
        if (err) return callback(err);
        pro.userSolved = res;
        ret(err, pro);
      });
      User.count({ tried: pro.pid }, function(err, res) {
        if (err) return callback(err);
        pro.userTried = res;
        ret(err, pro);
      });
      Object.keys(STATUS).forEach(function(key, index) {
        Solution.count({ pid: pro.pid, result: index },function(err, res) {
          if (err) return callback(err);
          pro.result[index] = res;
          ret(err, pro)
        });
      });
  });
};
problemSchema.methods.rejudge = function rejudge() {
  var Solution = mongoose.model('Solution');
  var pro = this;
  Solution.update({ pid: pro.pid, result: { $ne: STATUS.AC }}, {
    $set: { result: STATUS.WT1 }
  });
};

var Problem = mongoose.model('Problem', problemSchema);
