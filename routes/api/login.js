const express = require('express');
const router = express.Router();

const jwt = require('jsonwebtoken');
const model = require('../../models/model.js');
const crypto = require('crypto');

const bodyParser = require('body-parser');

router.use(bodyParser.urlencoded({
    extended: false
}));


/* GET users listing. */
router.post('/', function(req, res, next) {
    const {email, password} = req.body;
    const secret = req.app.get('jwt-secret');

    model.user.find()
        .where('email').equals(email)
        .then(result => {
        if(result.length == 0) {
            throw new Error('login-fail'); // 왜 로그인이 실패했는지 알려주면 보안상으로 안좋습니다.
        }
        const user_info = result[0];

        const hashed_password = crypto.createHmac('sha512', user_info.salt).update(password).digest('hex');

        if(hashed_password === user_info.password) {
            return new Promise((resolve, reject) => {
                jwt.sign(
                    {
                        _id: user_info._id,
                        role: user_info.role
                    },
                    secret,
                    {
                        expiresIn: '7d',
                        subject: 'userInfo'
                    }, (err, token) => {
                        if (err) reject(err);
                        else resolve(token);
                    });
            });
        }
        else {
            throw new Error('login-fail');
        }
    }).then(token => {
        res.status(200).json({
            message: "login-success",
            token
        });
    }).catch(err => {
        if(err.message === 'login-fail') {
            res.status(403).send({message: 'login-fail'});
        }
        else {
            console.log(err);
            res.status(500).send({message: 'server-error'});
        }
    });
});

module.exports = router;
