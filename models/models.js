/**
 * Created by Cai on 8/12/2015.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var CounterSchema = new Schema({
  _id: { type: String, required: true },
  cnt: { type: Number, default: 0 }
});

CounterSchema.statics.new = function newId(id, callback) {
  this.findByIdAndUpdate(id, { $inc: { cnt: 1 }},
    { upsert: true }, function (err, counter) {
      if (err) callback(err);
      var ret = (counter)? counter.cnt: 0;
      callback(null, ret);
    })
};


mongoose.model('Counter', CounterSchema);

require('./solution');
require('./problem');
require('./contest');
require('./user');
