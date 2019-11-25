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

//15-6
router.get('/getAssignmentList/:class_id/:nickname', function(req, res, next) {
    const user_id = mongoose.Types.ObjectId(req.decoded_token._id);
    const class_id = mongoose.Types.ObjectId(req.params.class_id);
    const nickname = req.params.nickname;

    model.user.findOne().where('_id').equals(user_id).then(result => {
        return model.classroom.findOne().where('_id').equals(class_id).where('classroom_owner').equals(result.nickname);
    }).then(result => {
        if(result === null) throw new Error('class-auth-fail');
        if(result.user_list.find(e => e === nickname) === undefined) throw new Error('not-class-user');
        if(result.classroom_owner.find(e => e === nickname) !== undefined) throw new Error('class-owner');
        return model.assignment.find().where('class_id').equals(req.params.class_id).where('user_nickname').equals(nickname)
            .select('name').select('start_date').select('end_date').select('problem_list').select('_id');
    }).then(result => {
        const response = result.concat();
        for(let i = 0; i < response.length; i++) {
            response[i]._doc.start_date = response[i]._doc.start_date.getTime();
            response[i]._doc.end_date = response[i]._doc.end_date.getTime();
        }
        res.status(200).json({assignment_list: response});
    }).catch(err => {
        console.log(err);
        if(err.message === 'class-auth-fail') res.status(403).json({message: 'class-auth-fail'});
        else if(err.message === 'class-owner') res.status(400).json({message: 'class-owner'});
        else if(err.message === 'not-class-user') res.status(404).json({message: 'not-class-user'});
        else res.status(500).json({message: 'server-error'});
    });
});

router.get('/getAssignmentProgress/:assignment_id', function(req, res, next) {
    const assignment_id = mongoose.Types.ObjectId(req.params.assignment_id);
    model.assignment.findOne().where("_id").equals(assignment_id).then(result => {
        if(result === null) throw new Error('not-exist-assignment');
        return model.judge.distinct("problem_number", {
            problem_number: {$in : result.problem_list},
            pending_date: {$gte: result.start_date, $lte: result.end_date},
            user_nickname: {$eq: result.user_nickname},
            state: {$eq: 2}
        });
    }).then(result => {
        res.json({acc_list: result});
    }).catch(err => {
        if(err.message === 'not-exist-assignment') {
            res.status(404).json('not-exist-assignment');
        }
        else {
            res.status(500).json('server-error');
        }
    });
});

//28-2
router.get('/getMyAssignmentList/:class_id', function(req, res, next) {
    const user_id = mongoose.Types.ObjectId(req.decoded_token._id);

    model.user.findOne().where('_id').equals(user_id).then(result => {
        if(result === null) throw new Error('invalid-token');
        return model.assignment.find().where('user_nickname').equals(result.nickname)
            .where('class_id').equals(req.params.class_id);
    }).then(result => {
        const response = result.concat();
        for(let i = 0; i < response.length; i++) {
            response[i]._doc.start_date = response[i]._doc.start_date.getTime();
            response[i]._doc.end_date = response[i]._doc.end_date.getTime();
        }
        res.status(200).json({assignment_list: result});
    }).catch(err => {
        if(err.message === 'invalid-token') {
            res.status(403).json({message: 'invalid-token'});
        }
        else res.status(500).json({message: 'server-error'});
    })
});

//27-2
router.get('/getMyAssignmentList', function(req, res, next) {
    const user_id = mongoose.Types.ObjectId(req.decoded_token._id);

    model.user.findOne().where('_id').equals(user_id).then(result => {
        if(result === null) throw new Error('invalid-token');
        return model.assignment.find().where('user_nickname').equals(result.nickname);
    }).then(result => {
        const response = result.concat();
        for(let i = 0; i < response.length; i++) {
            response[i]._doc.start_date = response[i]._doc.start_date.getTime();
            response[i]._doc.end_date = response[i]._doc.end_date.getTime();
        }
        res.status(200).json({assignment_list: result});
    }).catch(err => {
        if(err.message === 'invalid-token') {
            res.status(403).json({message: 'invalid-token'});
        }
        else res.status(500).json({message: 'server-error'});
    })
});

//29-2
router.get('/getAssignmentProblemList/:id',function(req,res,next) {
    model.assignment.findOne()
    .where('_id').equals(req.params.id)
    .then(result => {
        if(result === null) throw new Error ('no assignment exist');
        res.status(200).json(result.problem_list);
    }).catch(err => {
        if(err.message === 'no assignment exist'){
            res.status(400).json({message : "no assigment exist" });
        }else{
            res.status(500).json({message : "server-error"});
        }
    });
});

module.exports = router;