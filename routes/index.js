var mongoose = require('mongoose');
require('../models/models');
var User = mongoose.model('User');
var express = require('express');
var router = express.Router();
module.exports = router;
var common = require('../common');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', {
    title: 'index',
    js: [ '/js/index.js' ]
  });
});

router.get('/login', common.checkNotLogin);
router.get('/login', function(req, res, next) {
  return res.render('login', { title: 'login'});
});
router.post('/login', function(req, res, next) {
  var password = common.md5(req.body['password']);
  User.findOne({ name: req.body['username'] }, function(err, user) {
    if (!user) {
      req.flash('error', 'User not exist');
      return res.redirect('/login');
    }
    if (user.password != password) {
      req.flash('error', 'Wrong password');
      return res.redirect('/login');
    }
    req.session.user = user;
    req.flash('success', 'Hello, '+user.name);
    return res.redirect('/');
  });
});

router.get('/logout', common.checkLogin);
router.get('/logout', function(req, res, next) {
  req.session['user'] = null;
  req.flash('success', 'Logout success');
  return res.redirect('/');
});

router.get('/reg', common.checkNotLogin);
router.get('/reg', function(req, res, next) {
  return res.render('reg', { title: 'register' });
});
router.post('/reg', function(req, res, next) {
  if (req.body['password'] != req.body['confirm-password']) {
    req.flash('error', 'Passwords not match');
    return res.redirect('/reg');
  }
  var newUser = new User({
    name: req.body['username'],
    password: common.md5(req.body['password'])
  });
  User.findOne({ name: newUser.name }, function(err, user) {
    if (user) {
      req.flash('error', 'Username existed');
      return res.redirect('/reg');
    } else {
      newUser.save(function(err) {
        if (err) return next(err);
        req.session['user'] = newUser;
        req.flash('success', 'Hello, '+newUser.name);
        return res.redirect('/');
      });
    }
  });
});

router.get('/reg/exist/:username', function(req, res, next) {
  User.findOne({ name: req.params['username'] }, function(err, user) {
    return res.send({ exist: !!user });
  });
});

router.post('/uploader', function(req, res, next) {
  var fs = require('fs');
  fs.readFile(req.files.upload.path, function(err, data) {
    var newPath = 'public/files/'+req.files.upload.name;
    fs.writeFile(newPath, data, function(err) {
      if (err) res.view({ err: err });
      var html = "";
      html += "<script type='text/javascript'>";
      html += "    var funcNum = " + req.query.CKEditorFuncNum + ";";
      html += "    var url     = \"/files/" + req.files.upload.name + "\";";
      html += "    var message = \"Uploaded file successfully\";";
      html += "";
      html += "    window.parent.CKEDITOR.tools.callFunction(funcNum, url, message);";
      html += "</script>";
      res.send(html);
    })
  })
});
