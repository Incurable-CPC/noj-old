var Solution = require('../models/solution');
var Problem = require('../models/problem');
var express = require('express');
var router = express.Router();
module.exports = router;
var common = require('../common');
var test = require('assert');
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
      pro: list
    });
  });
});

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

router.post('/add', function(req, res, next) {
  var pro = new Problem(common.postHandle(req.body));
  var datafiles = {};
  req.files.testdata.forEach(function(file) {
    var name = file.originalname;
    name = name.slice(0, name.lastIndexOf('.'));
    if (!datafiles[name]) datafiles[name] = {};
    datafiles[name][file.extension] = file.name;
  });
  pro.save(function(err, pro) {
    fs.mkdir('./testdata/'+pro.pid, function(err) {
      test.equal(null, err);
      var cnt = 0;
      for (var key in datafiles) {
        var datafile = datafiles[key];
        if ((datafile.in)&&(datafile.out)) {
          (function(cnt, datafile) {
            var file = './testdata/'+pro.pid+'/testdata'+cnt;
            Object.keys(datafile).forEach(function(type) {
              fs.readFile('./tmp/'+datafile[type], function(err, data) {
                fs.writeFile(file+'.'+type, data);
                fs.unlink('./tmp/'+datafile[type]);
              });
            });
          })(cnt, datafile);
          cnt++;
        } else {
          for (var type in datafile) fs.unlink('./tmp/'+datafile[type]);
        }
      }
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

router.post('/submit/:pid', function(req, res, next) {
  var sol = req.body;
  sol.user = req.session.user.name;
  sol = new Solution(sol);
  sol.save(function(err) {
    req.flash('success', 'Submit success');
    return res.redirect('/status');
  });
});
