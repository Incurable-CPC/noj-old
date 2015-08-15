var Solution = require('./solution');
var Problem = require('./_problem');
var Model = require('./model');
var mongodb = require('./db');
var test = require('assert');
var STATUS = require('../common').STATUS;
var CONTEST_TYPE = require('../common').CONTEST_TYPE;
var CONTEST_STATUS = require('../common').CONTEST_STATUS;

function Contest(con) {
  var now = new Date();
  this.cid = (con.cid)? Number(con.cid): 1000;
  this.title = (con.title)? con.title: '';
  this.start = (con.start)? new Date(con.start): now;
  this.end = (con.end)? new Date(con.end): now;
  this.problems = (con.problems)? con.problems: [];
  this.type = (con.type)? Number(con.type): CONTEST_TYPE.PUBLIC;
  this.manager = (con.manager)? con.manager: '';
  this.status = (now < con.start)? CONTEST_STATUS.PENDING:
    ((now > con.end)? CONTEST_STATUS.ENDED: CONTEST_STATUS.RUNNING);

  this.teams = (con.teams)? con.teams: {};
};
module.exports = Contest;

var contestCnt;
Contest.init = function init(callback) {
  mongodb.collection('contests', function(err, collection) {
    test.equal(null, err);
    collection.findOne({}, { sort: [[ 'cid', -1 ]], returnKey: true }, function (err, con) {
      test.equal(null, err);
      contestCnt = (con)? con.cid-999: 0;
      if (callback) callback(err);
    });
  });
};

Contest.prototype.save = function save(callback) {
  var con = new Contest(this);
  mongodb.collection('contests', function(err, collection) {
    test.equal(null, err);
    collection.ensureIndex({ cid: -1 }, { unique: true }, function(err, result) {
      test.equal(null, err);
      con.cid = contestCnt+1000;
      contestCnt++;
      collection.insertOne(con, { safe: true }, function(err, result) {
        test.equal(null, err);
        callback(err, con);
      });
    });
  });
};

var model = new Model(Contest, 'contests', 'cid');
Contest.prototype.update = model.update();
Contest.get = model.get();
Contest.count = model.count();
Contest.getList = model.getList({ cid: -1 }, { problems: false });

Contest.prototype.addProblem = function addProblem(pid, callback) {
  var con = new Contest(this);
  con.problems.push(pid);
  con.update();
  Problem.get(pid, function(err, pro) {
    test.equal(null, err);
    pro.isHidden = true;
    pro.update(callback);
  });
};

Contest.prototype.getProblem = function getProblem(id, callback) {
  var con = new Contest(this);
  if ((id >= 0)&&(id < con.problems.length)) {
    Problem.get(con.problems[id], function(err, pro) {
      test.equal(null, err);
      pro.id = String.fromCharCode(id+65);
      callback(err, pro);
    });
  } else {
    callback();
  }
}

Contest.prototype.getAllProblem = function getAllProblem(callback) {
  var con = new Contest(this);
  if (con.problems.length) {
    var proList = {};
    con.problems.forEach(function(pid, i) {
      con.getProblem(i, function(err, pro) {
        test.equal(null, err);
        proList[pro.id] = pro;
        if (Object.keys(proList).length == con.problems.length) {
          callback(err, proList);
        }
      });
    });
  } else {
    callback(null, []);
  }
}

Contest.prototype.getSolutionsByUser = function getSolutionsByUser(user, page, callback) {
  var con = new Contest(this);
  var cond = {};
  cond['cid'] = con.cid;
  if (user) cond['user'] = user.name;
  Solution.getList({
    cond: cond,
    num: 25,
    page: page
  }, function(err, solList) {
    test.equal(null, err);
    solList.forEach(function(sol) {
    });
    callback(err, solList);
  });
}

function Team() {
  this.solved = 0;
  this.penalty = 0;
  this.proStatus = [];
}
function ProStatus() {
  this.submit = 0;
  this.solved = false;
  this.solvedTime = new Date();
}
Contest.prototype.submit = function submit(sid) {
  var con = new Contest(this);
  Solution.get(sid, function(err, sol) {
    if (sol.result < STATUS.AC) {
      setTimeout(function() {
        con.submit(sid);
      }, 3000);
    } else {
      if (!con.teams[sol.user]) con.teams[sol.user] = new Team();
      var team = con.teams[sol.user];
      var id = 0;
      while ((id < con.problems.length)&&(con.problems[id] != sol.pid)) id++;
      test.ok(id < con.problems.length);
      if (!team.proStatus[id]) team.proStatus[id] = new ProStatus();
      var proStatus = team.proStatus[id];
      if (proStatus.solved) return;
      proStatus.submit++;
      if (sol.result == STATUS.AC) {
        proStatus.solved = true;
        proStatus.solvedTime = (sol.date-con.start)/1000;
        team.solved++;
        team.penalty += (proStatus.submit-1)*20+proStatus.solvedTime/60;
      }
    }
  });
};
