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
  Solution.getList(page, function(err, list) {
    for (var i in list) {
      list[i].canView = (req.session.user)&&(list[i].user == req.session.user.name);
    }
    return res.render('status', {
      title: 'status',
      js: [ '/js/status.js' ],
      sol: list
    });
  });
});
