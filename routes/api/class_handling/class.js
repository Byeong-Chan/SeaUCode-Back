const express = require('express');
const router = express.Router();

const model = require('../../../models/model.js');
const auth = require('../../middleware/auth.js');
const mongoose = require('mongoose');

const bodyParser = require('body-parser');

router.use(bodyParser.urlencoded({
    extended: false
}));

router.use(auth);

router.post('/createClass', function(req, res, next) {
    const user_id = mongoose.Types.ObjectId(req.decoded_token._id);

    model.user.findOne()
        .where('_id').equals(user_id)
        .then(result => {
            if(result === null) throw new Error('invalid-token');
            if(result.role !== 1) throw new Error('role-auth-fail');

            const save_classroom = model.classroom({
                name : req.body.name,
                classroom_master : result.name,
                user_list : [result.nickname],
                classroom_owner : [result.nickname],
                notice_list : [],
                request_student_list: []
            });

            return save_classroom.save();
        }).then(result => {
            res.status(200).json({'class_id': result._id.toString()});
        }).catch(err => {
            if(err.message === 'invalid-token') {
                res.status(400).json({message:'invalid-token'});
            }
            else if(err.message === 'role-auth-fail') {
                res.status(403).json({message: 'role-auth-fail'});
            }
            else {
                res.status(500).json({message: 'server-error'});
            }
    });
});

router.get('/getClassInfo/:id', function(req, res, next) {
    const user_id = mongoose.Types.ObjectId(req.decoded_token._id);
    const class_id = mongoose.Types.ObjectId(req.params.id);

    const response = { name: '', notice : [], chatting: [] };

    let user_nickname = '';

    model.user.findOne()
        .where('_id').equals(user_id)
        .then(result => {
            if(result === null) throw new Error('not-exist-user');
            user_nickname = result.nickname;
            return model.classroom.findOne()
                .where('_id').equals(class_id)
        }).then(result => {
            if(!result)
                throw new Error('not-exist-class');
            if(result.user_list.find(function(element) { return element == user_nickname; }) === undefined)
                throw new Error('class-auth-fail');
            response.name = result.name;
            response.notice = response.notice.concat(result.notice_list.slice(-1));
            return model.chatting.find()
                .where('classroom_id').equals(class_id);
        }).then(result => {
            response.chatting = response.chatting.concat(result);
            res.status(200).json(response);
        }).catch(err => {
            if(err.message === 'not-exist-class') {
                res.status(404).json({message: 'not-exist-class'});
            }
            else if(err.message === 'class-auth-fail') {
                res.status(403).json({message: 'class-auth-fail'});
            }
            else if(err.message === 'not-exist-user') {
                res.status(403).json({message: 'not-exist-user'});
            }
            else {
                res.status(500).json({message: 'server-error'});
            }
    });
});

module.exports = router;
