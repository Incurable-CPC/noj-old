/// <reference path="typings/tsd.d.ts"/>
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var engine = require('ejs-mate');
var flash = require('connect-flash');
var multer = require('multer');
var app = express();

// view engine setup
app.engine('ejs', engine);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(multer({ dest: './tmp/' }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

var settings = require('./settings');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
app.use(session({
  secret: settings.cookieSecret,
  store: new MongoStore({
    db: settings.db
  }),
  resave: true,
  saveUninitialized: true
}));
app.use(flash());
app.use(function(req, res, next) {
  res.locals.user = req.session.user;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.layoutView = 'layout';
  res.locals.js = res.locals.css = [];
  res.locals.status = require('./common').status;
  res.locals.contestStatus = require('./common').contestStatus;
  res.locals.contestType = require('./common').contestType;
  res.locals.STATUS = require('./common').STATUS;
  next();
});


var routes = require('./routes/index');
var status = require('./routes/status');
var problems = require('./routes/problems');
var contests = require('./routes/contests');

app.use('/', routes);
app.use('/status', status);
app.use('/problems', problems);
app.use('/contests', contests);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
