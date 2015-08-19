/**
 * Created by Cai on 8/12/2015.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({
  name: { type: String, index: { unique: true}},
  password: String,
  admin: Boolean,
  solved: [Number],
  tried: [Number],
  lastSubmit: Date
});

var User = mongoose.model('User', userSchema);
