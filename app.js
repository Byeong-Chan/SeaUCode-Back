/* ----
 TODO: 개발이 모두 끝나고 나면 logger 등을 전부 제거하여 주십시오. */

const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const stylus = require('stylus');
const mongoose = require('mongoose');
const uri = require('./uri.js');
const secret_key = require('./secret_key');
const cors = require('cors'); // TODO: CORS 를 지우십시오.

/* ----
 TODO: 새로운 라우터경로를 추가해주십시오. */
const registerRouter = require('./routes/api/user_handling/register');
const loginRouter = require('./routes/api/login');
const logedinRouter = require('./routes/api/logedin');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.set('jwt-secret', secret_key.key);

// TODO: CORS 를 지우십시오.
app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(stylus.middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/register', registerRouter);
app.use('/login', loginRouter);
app.use('/logedin', logedinRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

/* ---------
 mongoose connected */

mongoose.connect(uri.mongodbUri, {useUnifiedTopology: true, useNewUrlParser: true, useCreateIndex: true });
mongoose.Promise = global.Promise;

const db = mongoose.connection;
db.on('error', console.error);
db.once('open', ()=>{
    console.log('connected to mongodb server')
});

/* ------- */

module.exports = app;
