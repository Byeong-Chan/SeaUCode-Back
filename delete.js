

const express = require('express');
const router = express.Router();

const jwt = require('jsonwebtoken');
const model = require('../../models/model.js');
const crypto = require('crypto');
const mongoose = require('mongoose');

const bodyParser = require('body-parser');

router.use(bodyParser.urlencoded({
    extended: false
}));




router.post('/', function(req, res, next) {
    const {nickname, name, user_id} = req.body;
    const secret = req.app.get('jwt-secret');





    model.user.find()
        .where('nickname').equals(nickname)
        .then(result => {
            if (result.length == 0) {
                throw new Error('search-fail'); // 검색 실패

            }
            const user_info = result[0];


            const remove_classroom = model.classroom({
                name: req.body.name,
                user_list: [ req.body.user_id],
                classroom_owner: req.body.nickname
            });


            console.log(remove_classroom);


            remove_classroom.remove({user_id: req.params.user_id}, function (err, output) {
                if (err) return res.status(500).json({error: "database failure"});



                res.status(403).json({message: 'delete-complete'});


                res.status(204).end();


            });
            return remove_classroom.remove();
        });
});

module.exports = router;
