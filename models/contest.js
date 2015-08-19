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
  problems: [ Number ],
  submissions: { type: Number, default: 0 }
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
  penalty: Number
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
  Counter.new('Contest', function(err, ret) {
    if (err) next(err);
    cont.cid = ret+1000;
    next();
  })
});

contestSchema.methods.getProblemSubId = function getProblemSubId(pid) {
  for (var id = 0; id < this.problems.length; id++) {
    if (this.problems[id] == pid) {
      return id;
    }
  }
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
    Problem.findOne({ pid: cont.problems[id] }, function(err, pro) {
      if (err) return callback(err);
      pro.subId = id+1001;
      var solved = 'problems.'+id+'.solved';
      var failed = 'problems.'+id+'.failed';
      Team.aggregate(
        { $match: { cid: cont.cid }},
        { $group: {
          _id: null,
          solved: { $sum: { $cond: [ solved, 1, 0]}},
          failed: { $sum: failed }
        }}, function (err, res) {
          if (err) return callback(err);
          if (res.length) {
            pro.solved = res[0].solved;
            pro.tried = res[0].failed + pro.solved;
          } else pro.solved = pro.tried = 0;
          callback(err, pro);
        });
    });
  } else {
    callback();
  }
};
contestSchema.methods.getAllProblems = function getAllProblems(callback) {
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
            team = new Team({
              cid: cont.cid,
              name: sol.user,
              proStatus: []
            });
          }
          team.check(cont.problems.length);
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
contestSchema.methods.getSolutions = function getSolutions(cond, page, callback) {
  var Solution = mongoose.model('Solution');
  var cont = this;
  cond['cid'] = cont.cid;
  Solution.find(cond, null, { skip: (page-1)*20, limit: 20, sort: { sid: -1 }},
    function(err, solList) {
      if (err) return callback(err);
      callback(err, solList);
    });
};
contestSchema.methods.getStanding = function getStanding(page, callback) {
  var cont = this;
  Team.find({ cid: cont.cid }, null,
    { sort: {solved: 1, penalty: -1 }, limit: 50, skip: (page-1)*50}, function (err, teamList) {
      if (err) return callback(err);
      teamList.forEach(function (team, i) {
        team.check(cont.problems.length);
        team.rank = i+(page-1)*50+1;
      });
      callback(err, teamList);
    });
};

teamSchema.methods.check = function check(proNum) {
  while (this.proStatus.length < proNum) {
    this.proStatus.push({
      solved: false,
      failed: 0
    })
  }
  this.save();
};
var Contest = mongoose.model('Contest', contestSchema);
var Team = mongoose.model('Team', teamSchema);
