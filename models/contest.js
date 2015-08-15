/**
 * Created by Cai on 8/14/2015.
 */

var CONTEST_STATUS = require('../common').CONTEST_STATUS;
var CONTEST_TYPE = require('../common').CONTEST_TYPE;
var STATUS = require('../common').STATUS;
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var contestSchema = new Schema({
  cid: { type: Number, index: { unique: true }},
  title: String,
  start: { type: Date, default: Date.now },
  end: { type: Date, default: Date.now },
  problems: [ Number ],
  type: { type: Number, default: CONTEST_TYPE.PUBLIC },
  manager: String
});
contestSchema.virtual('status').get(function() {
  var now = new Date();
  if (now < this.start) return CONTEST_STATUS.PENDING;
  if (now > this.end) return CONTEST_STATUS.ENDED;
  return CONTEST_STATUS.RUNNING;
});

contestSchema.pre('save', function(next) {
  var cont = this;
  if (cont.cid) return;
  var Counter = mongoose.model('Counter');
  Counter.findByIdAndUpdate('Contest', { $inc: { cnt: 1 }}, function (err, counter) {
    if (err) next(err);
    cont.cid = counter.cnt+1000;
    next();
  })
});

contestSchema.methods.addProblem = function(pid, callback) {
  this.problems.push(pid);
  this.save();
  callback(null, this);
  var Problem = mongoose.model('Problem');
  Problem.findOneAndUpdate({ pid: pid },
    { $set: { hidden: true }});
};
contestSchema.methods.getProblem = function addProblem(id, callback) {
  var cont = this;
  var Problem = mongoose.model('Problem');
  if ((id >= 0)&&(id < cont.problems.length)) {
    Problem.findOne({ pid: cont.problems[id] }, function(err, pro) {
      if (err) return callback(err);
      pro.subId = String.fromCharCode(id+65);
      callback(err, pro);
    });
  } else {
    callback();
  }
};
contestSchema.methods.getAllProblem = function getAllProblem(callback) {
  var cont = this;
  if (cont.problems.length) {
    var proList = [];
    var cnt = 0;
    cont.problems.forEach(function (pid, i) {
      cont.getProblem(i, function(err, pro) {
        if (err) callback(err);
        proList[i] = pro;
        cnt++;
        if (cnt == cont.problems.length) {
          console.log(proList);
          callback(err, proList);
        }
      });
    });
  } else {
    callback(null, []);
  }
};

var Contest = mongoose.model('Contest', contestSchema);
