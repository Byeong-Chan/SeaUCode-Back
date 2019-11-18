const express = require('express');
const router = express.Router();

const jwt = require('jsonwebtoken');
const model = require('./models/model.js');
const crypto = require('crypto');

const bodyParser = require('body-parser');

router.use(bodyParser.urlencoded({
    extended: false
}));


router.post('/', function(req, res, next) {
    const {name, user_id, nickname} = req.body;
    const secret = req.app.get('jwt-secret');

    model.user.find()
        .where('nickname').equals(nickname)
        .then(result => {
            if (result.length == 0) {
                throw new Error('serch-fail'); // 검색 실패
            }
            const user_info = result[0];

            const add_classroom = model.classroom({
                name: req.body.name,
                user_list: [req.body.user_id],
                classroom_owner: req.body.nickname
            });
            console.log(add_classroom);

            return add_classroom.save();
        }).then(token => {
        res.status(200).json({
            message: "save-success",
            token
        });
    }).catch(err => {
        if (err.message === 'save-fail') {
            res.status(403).json({message: 'save-fail'});
        } else {
            console.log(err);
            res.status(500).json({message: 'server-error'});
        }
    });
});

module.exports = router;


