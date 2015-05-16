var Problem = require('../models/problem');
var express = require('express');
var router = express.Router();
module.exports = router;
var common = require('../common');

router.get('/', function(req, res, next) {
  return res.redirect('/problems/list/1');
});

router.get('/list/:page', function(req, res, next) {
  var page = Number(req.params['page']);
  Problem.getList(page, function(err, list) {
    return res.render('problems/list', {
      title: 'problems',
      js: [ '/js/problems/problems.js' ],
      pro: list
    });
  });
});

router.get('/add', function(req, res, next) {
  return res.render('problems/add', {
    title: 'add-problem',
    js: [ '/js/problems/problems.js' ],
  });
});

router.post('/add', function(req, res, next) {
  var pro = new Problem(common.postHandle(req.body));
  pro.save(function(err) {
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
