var mongodb = require('./db');
var test = require('assert');

function Problem(problem) {
  this.title = problem.title;
  this.description = problem.description;
  this.input = problem.input;
  this.output = problem.output;
  this.sampleInput = problem.sampleInput;
  this.sampleOutput = problem.sampleOutput;
  this.source = problem.source;
  this.hint = problem.hint;
};
module.exports = Problem;

Problem.prototype.save = function save(callback) {
  var problem = {
    title: this.title,
    description: this.description,
    input: this.input,
    output: this.output,
    sampleInput: this.sampleInput,
    sampleOutput: this.sampleOutput,
    source: this.source,
    hint: this.hint
  };
  mongodb.open(function(err, db) {
    test.equal(null, err);
    db.collection('problems', function(err, collection) {
      test.equal(null, err);
      collection.ensureIndex({ pid: 1 }, { unique: true }, function(err, result) {
        test.equal(null, err);
        collection.findOne({}, { sort: [[ 'pid', -1 ]], returnKey: true }, function (err, pro) {
          console.log(pro);
          problem.pid = (pro)? pro.pid+1: 10000;
          collection.insertOne(problem, { safe: true }, function(err, result) {
            test.equal(null, err);
            db.close();
            callback(err, result);
          });
        });
      });
    });
  });
};

