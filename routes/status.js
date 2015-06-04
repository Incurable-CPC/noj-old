var Solution = require('../models/solution');
var express = require('express');
var router = express.Router();
module.exports = router;
var common = require('../common');

router.get('/', function(req, res, next) {
  return res.redirect('/status/page/1');
});

router.get('/page/:page', function(req, res, next) {
  var page = Number(req.params['page']);
  console.log(require('util').inspect(Solution));
  Solution.getList({ num: 50, page: page }, function(err, solList) {
    if (req.session['user']) {
      solList.forEach(function(sol) {
        sol.canView = sol.user == req.session['user'].name;
      });
    }
    return res.render('status', {
      title: 'status',
      js: [ '/js/status.js' ],
      solList: solList,
    });
  });
});

router.get('/code/:sid', common.checkLogin);
router.get('/code/:sid', function(req, res, next) {
  var sid = Number(req.params['sid']);
  Solution.get(sid, function(err, sol) {
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
