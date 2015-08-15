exports.status = [ 'Pending', 'Pending Rejudging', 'Compiling', 'Running & Judging',
  'Accepted', 'Presentation Error',
  'Wrong Answer', 'Time Limit Exceed', 'Memory Limit Exceed', 'Output Limit Exceed',
  'Runtime Error', 'Compile Error',
  'Compile OK', 'Test Running Done' ];
exports.STATUS = { WT0: 0, WT1 : 1, CI : 2, RI : 3,
  AC : 4, PE : 5,
  WA : 6, TLE : 7, MLE : 8, OLE : 9,
  RE : 10, CE : 11,
  CO : 12, TR : 13 };

exports.contestStatus = [ 'Pending', 'Running', 'Ended' ];
exports.CONTEST_STATUS = { PENDING: 0, RUNNING: 1, ENDED: 2 };
exports.contestType = [ 'Public', 'Private' ];
exports.CONTEST_TYPE = { PUBLIC: 0, PRIVATE: 1 };


exports.postHandle = function postHandle(obj) {
  var ret = {};
  for (var key in obj) {
    var newKey = key.split('-').reduce(function(sum, elt, i) {
      return sum.concat(elt.substr(0, 1).toUpperCase(), elt.substr(1));
    });
    ret[newKey] = obj[key];
  }
  return ret;
};

exports.refuse = function(req, res) {
  req.flash('error', 'Permission denied');
  return res.redirect('/');
}
exports.checkLogin = function checkLogin(req, res, next) {
  if (!req.session['user']) {
    req.flash('error', 'Not loged');
    return res.redirect('/login');
  }
  next();
}
exports.checkAdmin = function checkAdmin(req, res, next) {
  if ((!req.session['user'])||(!req.session['user'].admin)) {
    req.flash('error', 'Permission denied');
    return res.redirect('/');
  }
  next();
}
exports.checkNotLogin = function checkNotLogin(req, res, next) {
  if (req.session['user']) {
    req.flash('error', 'Already logged');
    return res.redirect('/');
  }
  next();
}
exports.md5 = function md5(str) {
  var md5 = require('crypto').createHash('md5');
  return md5.update(str).digest('base64');
}


Date.prototype.format = function (fmt) {
  var o = {
    'M+': this.getMonth()+1,
    'd+': this.getDate(),
    'h+': this.getHours(),
    'm+': this.getMinutes(),
    's+': this.getSeconds(),
    'q+': Math.floor((this.getMonth()+3)/3),
    'S': this.getMilliseconds()
  };
  if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear()+"").substr(4-RegExp.$1.length));
  for (var k in o)
    if (new RegExp("("+k+")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00"+o[k]).substr(("" + o[k]).length)));
  return fmt;
}

