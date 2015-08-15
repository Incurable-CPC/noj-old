/**
 * Created by Cai on 8/12/2015.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var CounterSchema = new Schema({
  _id: { type: String, required: true },
  cnt: { type: Number, default: 0 }
});
mongoose.model('Counter', CounterSchema);

require('./solution');
require('./problem');
require('./contest');
require('./user');
