var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var model = require('../../../models/model.js');
const crypto = require('crypto');
const uri = require('../../../uri.js');

const bodyParser = require('body-parser');

router.use(bodyParser.urlencoded({
    extended: false
}));

mongoose.connect(uri.mongodbUri, {useUnifiedTopology: true, useNewUrlParser: true, useCreateIndex: true });
mongoose.Promise = global.Promise;

/* GET home page. */
router.post('/', function(req, res, next) {
    /* -------------
     TODO: PASSWORD 검증 하는 작업을 여기서 하십시오. 모델에 저장되는 패스워드는 salt가 쳐진 형태입니다. */


    /* ------------- */

    model.user.find({email: req.body.email}).then(result => {
        if (result.length >= 1) {
            console.log(result);
            res.status(403).send({message: 'already-register'});
            return true;
        }
        return false;
    }).then(exist => {
        if(exist) {
            /*--------------
            TODO: email token 을 재발급 하는 기능을 만들어야 합니다. 이 부분에 대해서는 토론이 필요합니다. */

            console.log(exist);
        }
        else {
            var etoken = crypto.randomBytes(32).toString('hex');
            etoken = req.body.email + etoken;
            etoken = crypto.createHash('sha512').update(etoken).digest('hex');

            var user_salt = crypto.randomBytes(128).toString('hex');
            var hashed_password = crypto.createHmac('sha512', user_salt).update(req.body.password).digest('hex');

            save_obj = model.user({
                email: req.body.email,
                password: hashed_password,
                email_token: '', // TODO: 나중에 etoken 으로 변경
                email_auth: true, // TODO: 나중에 false 로 변경
                role: req.body.role,
                solved_problem: [],
                classroom: [],
                salt: user_salt
            });

            save_obj.save(err => {
                if (err) {
                    res.status(403).send({message: 'email-form-error'});
                }
                else {
                    /* ----------
                    TODO: 여기서 이메일을 보내는 작업을 작성하십시오. 비동기 작업이어야 합니다. */


                    res.status(200).send({message: 'register-success'});
                }
            });
        }
    }).catch(err => {
        /* --------
        TODO: 런타임 에러를 핸들링 하십시오. */

        res.status(500).send({message: 'server-error'});
    });
});

router.get('/authorization/:authToken', function(req, res, next) {
    /* -------
    TODO: 여기서 이메일 인증을 작성하십시오. */

    res.status(200).send({message: "email_auth_success"});
});

module.exports = router;
