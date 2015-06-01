var Solution = require('../models/solution');
var Problem = require('../models/problem');
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
  Problem.getList(page, function(err, list) {
    return res.render('problems/list', {
      title: 'problems',
      js: [ '/js/problems/problems.js' ],
      proList: list
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
    return res.redirect('/problems/add');
  });
});


router.get('/problem/:pid', function(req, res, next) {
  var pid = req.params['pid'];
  Problem.get(pid, function(err, pro) {
    if (pro) {
      return res.render('problems/problem', {
        title: pro.title,
        pro: pro,
        js: [ '/js/problems/problems.js' ],
      });
    } else {
      req.flash('error', 'Problem not exist');
      return res.redirect('/');
    }
  });
});

router.get('/submit/:pid', function(req, res, next) {
  var pid = req.params['pid'];
  return res.render('problems/submit', {
    title: 'submit',
    pid: pid
  });
});

router.post('/submit/:pid', common.checkLogin);
router.post('/submit/:pid', function(req, res, next) {
  var sol = req.body;
  sol.user = req.session.user.name;
  sol = new Solution(sol);
  sol.save(function(err) {
    req.flash('success', 'Submit success');
    return res.redirect('/status');
  });
});
