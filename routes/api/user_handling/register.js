const express = require('express');
const router = express.Router();

const model = require('../../../models/model.js');
const crypto = require('crypto');

const bodyParser = require('body-parser');

router.use(bodyParser.urlencoded({
    extended: false
}));

router.post('/', function(req, res, next) {
    new Promise((resolve, reject) => {
        /* -------------
         TODO: PASSWORD 검증 하는 작업을 여기서 하십시오. 모델에 저장되는 패스워드는 salt가 쳐진 형태입니다. */

        if(false) { // TODO: if 조건문을 적절히 수정해주세요.
            reject(new Error('password-error'));
        }
        else {
            resolve(model.user.findOne().where('email').equals(req.body.email));
        }
    }).then(result => {
        if (result) throw new Error('already-register');
        return model.user.findOne()
            .where('nickname').equals(req.body.nickname);
    }).then(result => {
        if (result) throw new Error('not-unique-nickname');
        return ;
    }).then(() => {
            let etoken = crypto.randomBytes(32).toString('hex');
            etoken = req.body.email + etoken;
            etoken = crypto.createHash('sha512').update(etoken).digest('hex');

            const user_salt = crypto.randomBytes(128).toString('hex');
            const hashed_password = crypto.createHmac('sha512', user_salt).update(req.body.password).digest('hex');

            const save_user = model.user({
                email: req.body.email,
                name: req.body.name,
                nickname: req.body.nickname,
                password: hashed_password,
                email_token: etoken,
                email_auth: true, // TODO: 나중에 false 로 변경
                role: req.body.role,
                solved_problem: [],
                classroom: [],
                salt: user_salt
            });

            return save_user.save();
    }).then(result => {
        console.log(result);
        /* ----------
        TODO: 여기서 이메일을 보내는 작업을 작성하십시오. 비동기 작업이어야 합니다. */
        res.status(200).json({message: 'register-success'});
    }).catch(err => {
        /* --------
        TODO: 런타임 에러를 핸들링 하십시오. */
        if(err.message === "already-register") {
            /*--------------
            TODO: email token 을 재발급 하는 기능을 만들어야 합니다. 이 부분에 대해서는 토론이 필요합니다. */

            res.status(403).json({message: 'already-register'});
        }
        else if(err.message === "password-error") {
            res.status(403).json({message: 'password-error'});
        }
        else if(err.message === 'not-unique-nickname') {
            res.status(403).json({message: 'not-unique-nickname'});
        }
        else if(err._message === 'User validation failed'){
            res.status(403).json({message: 'email-form-error'});
        }
        else {
            res.status(500).json({message: 'server-error'});
        }

    });
});

router.get('/authorization/:authToken', function(req, res, next) {
    /* -------
    TODO: 여기서 이메일 인증을 작성하십시오. */

    res.status(200).json({message: "email_auth_success"});
});

module.exports = router;
