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

