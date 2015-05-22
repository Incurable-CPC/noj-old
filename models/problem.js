var mongodb = require('./db');
var mkdirp = require('mkdirp');
var test = require('assert');
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
  this.testdataNum = (pro.testdataNum)? pro.testdataNum: 0;
};
module.exports = Problem;

Problem.prototype.save = function save(callback) {
  var problem = new Problem(this);
  mongodb.open(function(err, db) {
    test.equal(null, err);
    db.collection('problems', function(err, collection) {
      test.equal(null, err);
      collection.ensureIndex({ pid: 1 }, { unique: true }, function(err, result) {
        test.equal(null, err);
        collection.findOne({}, { sort: [[ 'pid', -1 ]], returnKey: true }, function (err, pro) {
          problem.pid = (pro)? pro.pid+1: 1000;
          collection.insertOne(problem, { safe: true }, function(err, result) {
            test.equal(null, err);
            db.close();
            callback(err, problem);
          });
        });
      });
    });
  });
};

Problem.prototype.update = function update() {
  var newPro = new Problem(this);
  Problem.get(newPro.pid, function(err, pro) {
    var diff = {};
    for (var key in pro) {
      if (newPro[key] != pro[key])
        diff[key] = newPro[key];
    }
    if (!diff) return;
    mongodb.open(function(err, db) {
      test.equal(null, err);
      db.collection('problems', function(err, collection) {
        test.equal(null, err);
        collection.findOneAndUpdate({ pid: pro.pid }, { $set: diff }, function(err) {
          test.equal(null, err);
        });
      });
    });
  });
};

Problem.get = function get(pid, callback) {
  mongodb.open(function(err, db) {
    test.equal(null, err);
    db.collection('problems', function(err, collection) {
      test.equal(null, err);
      collection.findOne({ pid: Number(pid) }, function(err, doc) {
        test.equal(null, err);
        db.close();
        if (doc) {
          var pro = new Problem(doc);
          callback(err, pro);
        } else {
          callback(err, null);
        }
      });
    });
  });
};

Problem.getList = function getList(page, callback) {
  mongodb.open(function(err, db) {
    test.equal(null, err);
    db.collection('problems', function(err, collection) {
      test.equal(null, err);
      collection.find({ pid: {
        $gte: 950+page*50,
        $lt: 1000+page*50
      } }, { pid: 1, title: 1 }).toArray(function(err, docs) {
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

Problem.prototype.addTestdata = function addTestdata(testdata, callback) {
  var pro = new Problem(this);
  var tmp = {};
  var datafiles = [];
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
  mkdirp('./testdata/'+pro.pid, function(err) {
    test.equal(null, err);
    var cnt = 0;
    datafiles.forEach(function(datafile, i) {
      var id = i+pro.testdataNum
      var file = './testdata/'+pro.pid+'/testdata'+id;
      Object.keys(datafile).forEach(function(type) {
        fs.readFile('./tmp/'+datafile[type], function(err, data) {
          test.equal(null, err);
          fs.writeFile(file+'.'+type, data);
          cnt++;
          if (cnt == 2*datafiles.length) callback(err);
        });
      });
    });
  });
};
