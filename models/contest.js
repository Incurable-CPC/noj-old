/**
 * Created by Cai on 8/14/2015.
 */

var CONTEST_STATUS = require('../common').CONTEST_STATUS;
var CONTEST_TYPE = require('../common').CONTEST_TYPE;
var STATUS = require('../common').STATUS;
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var test = require('assert');

var contestSchema = new Schema({
  cid: { type: Number, index: { unique: true }},
  title: String,
  start: { type: Date, default: Date.now },
  end: { type: Date, default: Date.now },
  type: { type: Number, default: CONTEST_TYPE.PUBLIC },
  manager: String,
  problems: [ Number ]
});

var teamSchema = new Schema({
  cid: { type: Number, index: true },
  name: { type: String, index: true },
  proStatus: [{
    solved: Boolean,
    solveTime: Number,
    failed: Number
  }],
  solved: Number,
  penalty: Number,
  lastSubmit: Date
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

contestSchema.methods.getProblemSubId = function getProblemSubId(pid) {
  for (var id = 0; id < this.problems.length; id++) {
    if (this.problems[id] == pid) {
      return id;
    }
  }
  test.throws(function() { throw new Error("Problem not Exist"); });
};
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
    Problem.findOne({ pid: cont.problems[id].pid }, function(err, pro) {
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
    cont.problems.forEach(function(pid, i) {
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
contestSchema.methods.submit = function(sid) {
  var cont = this;
  setTimeout(function() {
    var Solution = mongoose.model('Solution');
    Solution.findOne({ sid: sid }, function(err, sol) {
      if (err) return callback(err);
      if (sol.result < STATUS.AC) {
        cont.submit(sid);
      } else {
        Team.findOne({ cid: cont.cid, name: sol.user }, function(err, team) {
          if (!team) {
            team = new ContestTeam({
              cid: cont.cid,
              name: sol.user
            });
            team.save();
          }
          var proId = cont.getProblemSubId(sol.pid);
          var proStatus = team.proStatus[proId];
          if (proStatus.solved) return;
          if (sol.result == STATUS.AC) {
            proStatus.solved = true;
            proStatus.solvedTime = (sol.date-cont.start)/1000;
            team.solved++;
            team.penalty += proStatus.solvedTime/60+proStatus.failed*20;
          } else {
            proStatus.failed++;
          }
          team.proStatus.set(proId, proStatus);
          team.save();
        });
      }
    });
  }, 3000);
};

var Contest = mongoose.model('Contest', contestSchema);
var Team = mongoose.model('ContestTeam', teamSchema);
