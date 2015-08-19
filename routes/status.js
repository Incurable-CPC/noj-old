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
  if (page < 1) page = 1;
  Solution.find({ cid: null }, null, { num: 25, skip: 25*(page-1), sort: { sid: -1 } }, function(err, solList) {
    if (err) return next(err);
    common.checkSolCanView(solList, req);
    return res.render('status', {
      title: 'status',
      js: [ '/js/status.js' ],
      url: '/status/page/',
      page: page,
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
