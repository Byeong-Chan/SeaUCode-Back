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

router.get('/getAssignmentForModifying/:id', function(req, res, next) {
    const assignment_id = mongoose.Types.ObjectId(req.params.id);
    const user_id = mongoose.Types.ObjectId(req.decoded_token._id);

    const response = {};

    const SeaUCodeList = [];
    const outProblemList = [];

    model.assignment.findOne().where('_id').equals(assignment_id).then(result => {
        if(result === null) throw new Error('not-assignment');
        for(const key of Object.keys(result._doc)) {
            if(key === '__v') continue;
            if(key === '_id') continue;
            response[key] = result._doc[key];
            if(key === 'start_date' || key === 'end_date') response[key] = result._doc[key].getTime();
        }
        return model.classroom.findOne().where('_id').equals(result.class_id).where('classroom_owner').equals(result.teacher_nickname);
    }).then(result => {
        if(result === null) throw new Error('class-auth-fail');
        return model.user.findOne().where('_id').equals(user_id).where('nickname').in(result.classroom_owner);
    }).then(result => {
        if(result === null) throw new Error('teacher-auth-fail');
        for(let i = 0; i < response.problem_list.length; i++) {
            const item = response.problem_list[i];
            if(item.split('/')[0] === 'SeaUCode') {
                SeaUCodeList.push(parseInt(item.split('/')[1]));
            }
            else {
                outProblemList.push(item);
            }
        }
        return model.problem.find().where('problem_number').in(SeaUCodeList)
            .select({_id: 0}).select('Category').select('problem_number').select('name');
    }).then(result => {
        response.problem_list = result;
        for(let i = 0; i < response.problem_list.length; i++) {
            response.problem_list[i]._doc.problem_number = "SeaUCode/" + response.problem_list[i].problem_number;
        }
        return model.outProblem.find().where('problem_number').in(outProblemList)
            .select({_id: 0}).select('Category').select('problem_number').select('name');
    }).then(result=> {
        response.problem_list = response.problem_list.concat(result);
        res.status(200).json(response);
    }).catch(err => {
        console.log(err);
        if(err.message === 'not-assignment')
            res.status(404).json({message: 'not-assignment'});
        else if(err.message === 'class-auth-fail')
            res.status(403).json({message: 'class-auth-fail'});
        else if(err.message === 'teacher-auth-fail')
            res.status(403).json({message: 'teacher-auth-fail'});
        else
            res.status(500).json({message: 'server-error'});
    });
});

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
        if(err.message === 'class-auth-fail') res.status(403).json({message: 'class-auth-fail'});
        else if(err.message === 'class-owner') res.status(400).json({message: 'class-owner'});
        else if(err.message === 'not-class-user') res.status(404).json({message: 'not-class-user'});
        else res.status(500).json({message: 'server-error'});
    });
});

router.get('/getAssignmentProgress/:assignment_id', function(req, res, next) {
    const assignment_id = mongoose.Types.ObjectId(req.params.assignment_id);

    const SeaUCodeList = [];
    const outProblemList = [];

    const user_oj_id = {};

    const response = {};

    const asg_info = {}

    model.assignment.findOne().where("_id").equals(assignment_id).then(result => {
        if (result === null) throw new Error('not-exist-assignment');

        for (let i = 0; i < result.problem_list.length; i++) {
            const item = result.problem_list[i];
            if (item.split('/')[0] === 'SeaUCode') {
                SeaUCodeList.push(parseInt(item.split('/')[1]));
            }
            else {
                outProblemList.push(item);
            }
        }

        asg_info.start_date = result.start_date;
        asg_info.end_date = result.end_date;
        asg_info.user_nickname = result.user_nickname;

        return model.user.findOne().where("nickname").equals(asg_info.user_nickname);
    }).then(result=>{
        if(result !== null) {
            user_oj_id.boj_id = result.boj_id;
            user_oj_id.codeforces_id = result.codeforces_id;
            user_oj_id.spoj_id = result.spoj_id;
        }
        else {
            user_oj_id.boj_id = '';
            user_oj_id.codeforces_id = '';
            user_oj_id.spoj_id = '';
        }

        return model.judge.distinct("problem_number", {
            problem_number: {$in : SeaUCodeList},
            pending_date: {$gte: asg_info.start_date, $lte: asg_info.end_date},
            user_nickname: {$eq: asg_info.user_nickname},
            state: {$eq: 2}
        });
    }).then(result => {
        for (let i = 0; i < result[i]; i++) {
            result[i] = 'SeaUCode/' + result[i];
        }
        response.acc_list = result;
        return model.outJudgeResult.distinct("problem_number", {
            problem_number: { $in : outProblemList },
            oj: "boj",
            oj_id: user_oj_id.boj_id
        });
    }).then(result => {
        response.acc_list = response.acc_list.concat(result);
        return model.outJudgeResult.distinct("problem_number", {
            problem_number: { $in : outProblemList },
            oj: "codeforces",
            oj_id: user_oj_id.codeforces_id
        });
    }).then(result => {
        response.acc_list = response.acc_list.concat(result);
        return model.outJudgeResult.distinct("problem_number", {
            problem_number: { $in : outProblemList },
            oj: "spoj",
            oj_id: user_oj_id.spoj_id
        });
    }).then(result => {
        response.acc_list = response.acc_list.concat(result);
        res.status(200).json(response);
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