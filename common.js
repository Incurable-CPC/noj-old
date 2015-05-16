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
