/* ----
 TODO: 개발이 모두 끝나고 나면 logger 등을 전부 제거하여 주십시오. */

const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const stylus = require('stylus');
const config = require('./config');
const cors = require('cors'); // TODO: 로컬환경 테스트 용도인 CORS 를 나중에 지우십시오.

/* ----
 TODO: 새로운 라우터경로를 추가해주십시오. */
const adminRouter = require('./routes/api/admin_handling/admin');
const registerRouter = require('./routes/api/user_handling/register');
const loginRouter = require('./routes/api/login');
const loggedInRouter = require('./routes/api/loggedIn');
const classRouter = require('./routes/api/class_handling/class');
const userRouter = require('./routes/api/user_handling/user');
const assignmentRouter = require('./routes/api/assignment_handling/assignment');
const problemsRouter = require('./routes/api/problem_handling/problems');
const pendingRouter = require('./routes/api/judge_handling/pending');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.set('jwt-secret', config.key);

// TODO: 로컬 환경 테스트 용도인 CORS 를 나중에 지우십시오.
app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(stylus.middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/admin', adminRouter);
app.use('/api/register', registerRouter);
app.use('/api/login', loginRouter);
app.use('/api/loggedIn', loggedInRouter);
app.use('/api/class', classRouter);
app.use('/api/user',userRouter);
app.use('/api/pending', pendingRouter);
app.use('/api/problems', problemsRouter);
app.use('/api/assignment', assignmentRouter);

app.get('*', function (request, response){
    response.sendFile(path.resolve(__dirname, 'public', 'index.html'))
});

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
/* ------- */

module.exports = app;
