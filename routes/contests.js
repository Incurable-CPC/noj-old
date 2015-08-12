var CONTEST_STATUS = require('../common').CONTEST_STATUS;
var Contest = require('../models/contest');
var Problem = require('../models/problem');
var Solution = require('../models/solution');
var express = require('express');
var marked = require('marked');
var router = express.Router();
module.exports = router;
var common = require('../common');
var path = require('path');
var fs = require('fs');

router.get('/', function(req, res, next) {
  return res.redirect('/contests/page/1');
});

router.get('/page/:page', function(req, res, next) {
  var page = Number(req.params['page']);
  Contest.getList({ num: 20, page: page }, function(err, conList) {
    return res.render('contests/list', {
      title: 'contests',
      js: [ '/js/contests/contests.js' ],
      conList: conList,
    });
  });
});

router.get('/add', common.checkAdmin);
router.get('/add', function(req, res, next) {
  return res.render('contests/add', {
    title: 'add-contest',
    js: [
      '/js/contests/contest.js',
      '/js/input-file.js'
    ],
    css: [
      '/css/input-file.css'
    ]
  });
});

router.post('/add', common.checkAdmin);
router.post('/add', function(req, res, next) {
  var contest = common.postHandle(req.body);
  contest.manager = req.session['user'].name;
  contest = new Contest(contest);
  contest.save(function(err, con) {
    req.flash('success', 'Add contest success');
    res.redirect('/contests/contest/'+con.cid);
  });
});

router.all('/:cid', function(req, res, next) {
  var cid = Number(req.params['cid']);
  Contest.get(cid, function(err, con) {
    if (!con) {
      req.flash('error', 'Contest not exist');
      return res.redirect('/');
    } else {
      next();
    }
  });
});
router.all('/:cid/*', function(req, res, next) {
  var cid = Number(req.params['cid']);
  Contest.get(cid, function(err, con) {
    if (!con) {
      req.flash('error', 'Contest not exist');
      return res.redirect('/');
    } else {
      var user = req.session['user'];
      if (((!user)||(con.manager != user.name))&&(con.status == CONTEST_STATUS.PENDING)) {
        req.flash('error', 'Contest not start');
        return res.redirect('/contests/'+cid);
      } else {
        next();
      }
    }
  });
});
router.get('/:cid', function(req, res, next) {
  var cid = Number(req.params['cid']);
  Contest.get(cid, function(err, con) {
    con.isManager = ((req.session['user'])&&(con.manager == req.session['user'].name));
    con.getAllProblem(function(err, proList) {
      return res.render('contests/contest', {
        title: con.title,
        layoutView: 'contests/layout',
        con: con,
        proList: proList,
        js: [ '/js/contests/contests.js' ]
      });
    });
  });
});
router.get('/:cid/status', function(req, res, next) {
  var cid = Number(req.params['cid']);
  var user = req.session['user'];
  Contest.get(cid, function(err, con) {
    con.getSolutionsByUser(user, 1, function(err, solList) {
      return res.render('contests/status', {
        title: con.title+'-status',
        layoutView: 'contests/layout',
        con: con,
        solList: solList
      });
    });
  });
});
router.get('/:cid/problem/:id*', function(req, res, next) {
  var cid = Number(req.params['cid']);
  var id = req.params['id'].charCodeAt()-65;
  Contest.get(cid, function(err, con) {
    con.getProblem(id, function(err, pro) {
      if (!pro) {
        req.flash('error', 'Problem not exist');
        return res.redirect('/contests/'+cid);
      } else next();
    });
  });
});
router.get('/:cid/problem/:id', function(req, res, next) {
  var cid = Number(req.params['cid']);
  var id = req.params['id'].charCodeAt()-65;
  Contest.get(cid, function(err, con) {
    con.getProblem(id, function(err, pro) {
      return res.render('contests/problem', {
        title: pro.title,
        layoutView: 'contests/layout',
        con: con,
        pro: pro,
      });
    });
  });
});

router.get('/:cid/problem/:id/submit', common.checkLogin);
router.get('/:cid/problem/:id/submit', function(req, res, next) {
  var cid = Number(req.params['cid']);
  Contest.get(cid, function(err, con) {
    return res.render('problems/submit', {
      title: 'submit-'+con.title,
      layoutView: 'contests/layout',
      con: con,
      pid: req.params['id']
    });
  });
});
router.post('/:cid/problem/:id/submit', common.checkLogin);
router.post('/:cid/problem/:id/submit', function(req, res, next) {
  var cid = Number(req.params['cid']);
  Contest.get(cid, function(err, con) {
    console.log(con.status);
    if (con.status != CONTEST_STATUS.RUNNING) {
      req.flash('error', 'Out of contest time');
      return res.redirect('/contests/'+cid);
    }
    var sol = req.body;
    sol.user = req.session.user.name;
    sol.cid = cid;
    var file = req.files['code-file'];
    var submit = function submit(sol) {
      sol = new Solution(sol);
      sol.save(function(err) {
        req.flash('success', 'Submit success');
        return res.redirect('/contests/'+cid+'/status');
        con.submit(sol.sid);
      });
    };
    if (file) {
      var filename = path.join('tmp', file.name);
      fs.readFile(filename, function(err, code) {
        sol.code = code;
        fs.unlink(filename);
        submit(sol);
      });
    } else submit(sol);
  });
});


router.get('/:cid/add/problem', common.checkAdmin);
router.get('/:cid/add/problem', function(req, res, next) {
  var cid = Number(req.params['cid']);
  Contest.get(cid, function(err, con) {
    if (con.manager == req.session['user'].name) {
      return res.render('problems/add', {
        title: con.title+'-add-problem',
        layoutView: 'contests/layout',
        con: con,
        js: [
          '/js/contests/contests.js',
          '/js/input-file.js'
        ],
        css: [
          '/css/input-file.css'
        ]
      });
    } else common.refuse(req, res);
  });
});

router.post('/:cid/add/problem', common.checkAdmin);
router.post('/:cid/add/problem', function(req, res, next) {
  var cid = Number(req.params['cid']);
  var pro = new Problem(common.postHandle(req.body));
  pro.description = marked(pro.description);
  pro.input = marked(pro.input);
  pro.output = marked(pro.output);
  pro.save(function(err, pro) {
    pro.addTestdata(req.files.testdata, function(err) {
      if (!req.files.testdata) return;
      req.files.testdata.forEach(function(file) {
        fs.unlink(path.join('tmp', file.name));
      });
    });
    Contest.get(cid, function(err, con) {
      con.addProblem(pro.pid);
      req.flash('success', 'Add problem success');
      return res.redirect('/contests/contest/'+cid);
    });
  });
});

