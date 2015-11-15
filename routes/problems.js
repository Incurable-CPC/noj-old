var mongoose = require('mongoose');
require('../models/models');
var Solution = mongoose.model('Solution');
var Problem = mongoose.model('Problem');
var User = mongoose.model('User');
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
  var Counter = mongoose.model('Counter');
  Problem.find({ pid : { $gte: 950+page*50, $lt: 1000+page*50 }}, function(err, proList) {
    if (err) return next(err);
    User.findOne({ name: username }, function(err, user) {
      if (err) return next(err);
      proList.forEach(function(pro) {
        pro.solved = ((!!user)&&(pro.pid in user.solved));
        pro.tried = ((!!user)&&(pro.pid in user.tried));
      });
      Counter.findById('Problem', function(err, counter) {
        if (err) return next(err);
        var cnt = counter? counter.cnt: 0;
        if (err) return next(err);
        return res.render('problems/list', {
          title: 'problems',
          js: ['/js/problems/problems.js'],
          page: page,
          maxPage: 1+Math.floor(cnt/50),
          proList: proList
        });
      });
    });
  });
});

router.get('/add', common.checkAdmin);
router.get('/add', function(req, res, next) {
  return res.render('problems/add', {
    title: 'add-problem',
    action: 'add',
    js: [ '/js/problems/problems.js' ]
  });
});
router.post('/add', common.checkAdmin);
router.post('/add', function(req, res, next) {
  var pro = new Problem(common.postHandle(req.body));
  pro.save(function(err, pro) {
    if (err) return next(err);
    pro.addTestdata(req.files['testdata'], function(err) {
      if (err) return next(err);
      req.flash('success', 'Add problem success');
      return res.redirect('/problems/'+pro.pid);
    });
  });
});

router.all('/:pid*', function(req, res, next) {
  var pid = Number(req.params['pid']);
  Problem.findOne({ pid: pid }, function(err, pro) {
    if (err) return next(err);
    if ((!pro)||(pro.hidden)) {
      req.flash('error', 'Problem not exist');
      return res.redirect('/');
    } else {
      next();
    }
  });
});
router.get('/:pid', function(req, res, next) {
  var pid = Number(req.params['pid']);
  Problem.findOne({ pid: pid }, function(err, pro) {
    if (err) return next(err);
    return res.render('problems/problem', {
      title: pro.title,
      pro: pro,
      js: [ '/js/problems/problems.js' ]
    });
  });
});

router.get('/:pid/load', function(req, res, next) {
  var pid = Number(req.params['pid']);
  Problem.findOne({ pid: pid }, function(err, pro) {
    if (err) return next(err);
    return res.send(pro);
  });
});
router.get('/:pid/data/:id/:type', common.checkAdmin);
router.get('/:pid/data/:id/:type', function(req, res, next) {
  var type = req.params['type'];
  var pid = Number(req.params['pid']);
  var id = Number(req.params['id']);
  Problem.findOne({pid: pid}, function(err, pro) {
    if (err) return next(err);
    if ((id < pro.testdataNum)&&((type == 'in')||(type =='out'))) {
      var filePath = path.join('sandbox', 'testdata', String(pid), 'data'+id+'.'+type);
      fs.readFile(filePath, function(err, data) {
        if (err) return next(err);
        return res.send(data);
      });
    } else {
      req.flash('error', 'Testdata not exist');
      return res.redirect('/');
    }
  })
});
router.get('/:pid/edit', common.checkAdmin);
router.get('/:pid/edit', function(req, res, next) {
  var pid = Number(req.params['pid']);
  return res.render('problems/add', {
    title: 'edit-problem',
    pid: pid,
    action: 'edit',
    js: ['/js/problems/problems.js']
  });
});
router.post('/:pid/edit', common.checkAdmin);
router.post('/:pid/edit', function (req, res, next) {
  var pid = Number(req.params['pid']);
  var newPro = common.postHandle(req.body);
  Problem.findOneAndUpdate({ pid: pid }, newPro, function(err, pro) {
    if (err) return next(err);
    req.flash('success', 'Edit problem success');
    return res.redirect('/problems/'+pro.pid);
  });
});
router.post('/:pid/add-testdata', common.checkAdmin);
router.post('/:pid/add-testdata', function(req, res, next) {
  var pid = Number(req.params['pid']);
  Problem.findOne({ pid: pid }, function(err, pro) {
    pro.addTestdata(req.files.testdata, function(err) {
      if (err) return next(err);
      req.flash('success', 'Add testdata success');
      res.redirect('/problems/'+pid+'/edit');
    });
  });
});

router.get('/:pid/statistics', function(req, res, next) {
  var pid = Number(req.params['pid']);
  Problem.findOne({ pid: pid }, function(err, pro) {
    if (err) return next(err);
    pro.getStatistics(1, function(err, pro) {
      if (err) return next(err);
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
      if (err) return next(err);
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
