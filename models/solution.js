var STATUS = require('../common').STATUS;
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var test = require('assert');

var solutionSchema = new Schema({
	sid: { type: Number, index: { unique: true }},
	code: String,
	lang: Number,
	user: { type: String, index: true },
	pid: { type: Number, index: true },
	cid: { type: Number, index: true },
	date: { type: Date, default: Date.now },
	codeLength: Number,
	result: Number,
	timeUsage: Number,
	memoryUsage: Number
});
solutionSchema.pre('save', function(next) {
  var sol = this;
  sol.codeLength = sol.code.length;
  if (sol.sid) return;
  var Counter = mongoose.model('Counter');
  Counter.findByIdAndUpdate('Counter', { $inc: { cnt: 1 }}, function (err, counter) {
    if (err) next(err);
    sol.sid = counter.cnt+100000;
    next();
  })
});

mongoose.model('Solution', solutionSchema);
