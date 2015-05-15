var User = require('../models/user');
var express = require('express');
var router = express.Router();
var util = require('util');
module.exports = router;

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'index', });
});

router.get('/login', checkNotLogin);
router.get('/login', function(req, res, next) {
  return res.render('login', { title: 'login'});
});

router.post('/login', function(req, res, next) {
  var password = md5(req.body['password']);
  User.get(req.body['username'], function(err, user) {
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

router.get('/logout', checkLogin);
router.get('/logout', function(req, res, next) {
  req.session['user'] = null;
  req.flash('success', 'Logout success');
  return res.redirect('/');
});

router.get('/reg', checkNotLogin);
router.get('/reg', function(req, res, next) {
  return res.render('reg', {
    title: 'register',
    js: [ '/js/reg.js' ]
  });
});

router.post('/reg', function(req, res, next) {
  if (req.body['password'] != req.body['confirm-password']) {
    req.flash('error', 'passwords not match');
    return res.redirect('/reg');
  }
  var newUser = new User({
        name: req.body['username'],
        password: md5(req.body['password'])
      });
  User.get(newUser.name, function(err, user) {
    if (user) {
      req.flash('error', 'Username existed');
      return res.redirect('/reg');
    } else {
      newUser.save(function(err) {
        req.session['user'] = newUser;
        req.flash('success', 'Hello, '+newUser.name);
        return res.redirect('/');
      });
    }
  });
});

router.get('/reg/exist/:username', function(req, res, next) {
  User.get(req.params['username'], function(err, user) {
    return res.send({ exist: !!user });
  });
});

function checkLogin(req, res, next) {
  if (!req.session['user']) {
    req.flash('error', 'not loged');
    return res.redirect('/');
  }
  next();
}
function checkNotLogin(req, res, next) {
  if (req.session['user']) {
    req.flash('error', 'already logged');
    return res.redirect('/');
  }
  next();
}
function md5(str) {
  var md5 = require('crypto').createHash('md5');
  return md5.update(str).digest('base64');
}

