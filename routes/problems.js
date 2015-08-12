var Solution = require('../models/solution');
var Problem = require('../models/problem');
var User = require('../models/user');
var express = require('express');
var marked = require('marked');
var router = express.Router();
module.exports = router;
var common = require('../common');
var test = require('assert');
var path = require('path');
var fs = require('fs');

router.get('/', function(req, res, next) {
  return res.redirect('/problems/list/1');
});

router.get('/list/:page', function(req, res, next) {
  var page = Number(req.params['page']);
  var username = (req.session['user'])? req.session['user'].name: '';
  Problem.getList(page, function(err, list) {
    User.get(username, function(err, user) {
      list.forEach(function(pro) {
        pro.solved = ((!!user)&&(!!user.solved[pro.pid]));
        pro.tried = ((!!user)&&(!!user.tried[pro.pid]));
      });
      return res.render('problems/list', {
        title: 'problems',
        js: [ '/js/problems/problems.js' ],
        proList: list
      });
    });
  });
});

router.get('/add', common.checkAdmin);
router.get('/add', function(req, res, next) {
  return res.render('problems/add', {
    title: 'add-problem',
    js: [
      '/js/problems/problems.js',
      '/js/input-file.js'
    ],
    css: [
      '/css/input-file.css'
    ]
  });
});

router.post('/add', common.checkAdmin);
router.post('/add', function(req, res, next) {
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
    req.flash('success', 'Add problem success');
    return res.redirect('/problems/problem/'+pro.pid);
  });
});


router.all('/:pid*', function(req, res, next) {
  var pid = Number(req.params['pid']);
  Problem.get(pid, function(err, pro) {
    if ((!pro)||(pro.isHidden)) {
      req.flash('error', 'Problem not exist');
      return res.redirect('/');
    } else {
      next();
    }
  });
});

router.get('/:pid', function(req, res, next) {
  var pid = Number(req.params['pid']);
  Problem.get(pid, function(err, pro) {
    return res.render('problems/problem', {
      title: pro.title,
      pro: pro,
      js: [ '/js/problems/problems.js' ]
    });
  });
});

router.get('/:pid/statistics', function(req, res, next) {
  var pid = Number(req.params['pid']);
  Problem.get(pid, function(err, pro) {
    pro.getStatistics(1, function(err, pro) {
      if (req.session['user']) {
        pro.solList.forEach(function(sol) {
          sol.canView = sol.user == req.session['user'].name
        });
      }
      return res.render('problems/statistics', {
        title: pro.title+' - statistics',
        pro: pro,
        css: [ '/css/statistics.css' ]
      });
    });
  });
});

router.get('/:pid/submit', common.checkLogin);
router.get('/:pid/submit', function(req, res, next) {
  var pid = Number(req.params['pid']);
  return res.render('problems/submit', {
    title: 'submit',
    pid: pid
  });
});

router.post('/:pid/submit', common.checkLogin);
router.post('/:pid/submit', function(req, res, next) {
  var sol = req.body;
  sol.user = req.session.user.name;
  var file = req.files['code-file'];
  var submit = function submit(sol) {
    sol = new Solution(sol);
    sol.save(function(err) {
      req.flash('success', 'Submit success');
      return res.redirect('/status');
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
