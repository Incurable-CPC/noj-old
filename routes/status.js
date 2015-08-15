var mongoose = require('mongoose');
var Solution = mongoose.model('Solution');
var express = require('express');
var router = express.Router();
module.exports = router;
var common = require('../common');

router.get('/', function(req, res, next) {
  return res.redirect('/status/page/1');
});

router.get('/page/:page', function(req, res, next) {
  var page = Number(req.params['page']);
  Solution.find({}, null, { num: 50, skip: 50*(page-1), sort: { sid: -1 } }, function(err, solList) {
    if (req.session['user']) {
      solList.forEach(function(sol) {
        sol.canView = sol.user == req.session['user'].name;
      });
    }
    return res.render('status', {
      title: 'status',
      js: [ '/js/status.js' ],
      solList: solList
    });
  });
});

router.get('/code/:sid', common.checkLogin);
router.get('/code/:sid', function(req, res, next) {
  var sid = Number(req.params['sid']);
  Solution.findOne({ sid: sid }, function(err, sol) {
    if (!sol) {
      req.flash('error', 'Submission not exist');
      return res.redirect('/');
    } else if (sol.user != req.session.user.name) {
      req.flash('error', 'You can only view your submission');
      return res.redirect('/');
    } else {
      return res.render('code', {
        title: 'solution',
        sol: sol,
        js: [ '/js/prettify.js' ]
      });
    }
  });
});
