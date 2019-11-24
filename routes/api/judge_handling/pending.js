const express = require('express');
const router = express.Router();

const model = require('../../../models/model.js');
const mongoose = require('mongoose');

const bodyParser = require('body-parser');

const auth = require('../../middleware/auth.js');

router.use(bodyParser.urlencoded({
    extended: false
}));

router.use(auth);

router.post('/submitCode', (req, res, next) => {
    const judge_obj = {
        state: 1,
        pending_date: Date.now(),
        code: req.body.code,
        language: req.body.language,
        user_id: req.decoded_token._id,
        problem_number: req.body.problem_number,
        memory_usage: 0,
        time_usage: 0,
        ErrorMessage: '',
        is_solution_provide : false,
        user_nickname: ''
    };

    model.user.findOne().where('_id').equals(mongoose.Types.ObjectId(req.decoded_token._id)).then(result => {
        if(result === null) throw new Error('user-not-found');
        judge_obj.user_nickname = result.nickname;
        const save_judge_result = model.judge(judge_obj);
        return save_judge_result.save()
    }).then(result => {
        // TODO: 여기서 Judge Queue 만들것 지금 당장은 서버가 1개만 있다고 가정 후 코딩
        const save_judge_queue = model.judgeQueue({
            server_number: 1,
            pending_number: result.pending_number
        });
        return save_judge_queue.save();
    }).then(result => {
        res.status(200).json({message: 'submit-success'});
    }).catch(err => {
        if(err.message === 'user-not-found') res.status(404).json({message: 'user-not-found'});
        else res.status(500).json('server-error');
    });
});

router.get('/getJudgeResultList/:page', (req, res, next) => {
    const user_id = mongoose.Types.ObjectId(req.decoded_token._id);
    model.judge.find().where('user_id').equals(user_id)
        .sort({pending_number: -1}).skip(req.params.page * 15 - 15).limit(15)
        .select({'_id': 0}).select('problem_number').select('pending_number').select('state').select('memory_usage').select('time_usage').select('code').select('language')
        .then(result => {
            const returnValue = [];
            for(let i = 0; i < result.length; i++) {
                returnValue.push({
                    pending_number: result[i].pending_number,
                    state: result[i].state,
                    problem_number: result[i].problem_number,
                    memory_usage: result[i].memory_usage,
                    time_usage: result[i].time_usage,
                    code_length: result[i].code.length,
                    language: result[i].language
                });
            }
            res.status(200).json({judge_result_list: returnValue});
        }).catch(err => {
            console.log(err);
            res.status(500).json({message: "server-error"});
    })
});

router.get('/getJudgeResultList/pending_number/:field/:page', (req, res, next) => {
    const user_id = mongoose.Types.ObjectId(req.decoded_token._id);
    model.judge.find().where('user_id').equals(user_id)
        .where('pending_number').equals(req.params.field)
        .sort({pending_number: -1}).skip(req.params.page * 15 - 15).limit(15)
        .select({'_id': 0}).select('problem_number').select('pending_number').select('state').select('memory_usage').select('time_usage').select('code').select('language')
        .then(result => {
            const returnValue = [];
            for(let i = 0; i < result.length; i++) {
                returnValue.push({
                    pending_number: result[i].pending_number,
                    state: result[i].state,
                    problem_number: result[i].problem_number,
                    memory_usage: result[i].memory_usage,
                    time_usage: result[i].time_usage,
                    code_length: result[i].code.length,
                    language: result[i].language
                });
            }
            res.status(200).json({judge_result_list: returnValue});
        }).catch(err => {
        res.status(500).json({message: "server-error"});
    })
});

router.get('/getJudgeResultList/problem_number/:field/:page', (req, res, next) => {
    const user_id = mongoose.Types.ObjectId(req.decoded_token._id);
    model.judge.find().where('user_id').equals(user_id)
        .where('problem_number').equals(req.params.field)
        .sort({pending_number: -1}).skip(req.params.page * 15 - 15).limit(15)
        .select({'_id': 0}).select('problem_number').select('pending_number').select('state').select('memory_usage').select('time_usage').select('code').select('language')
        .then(result => {
            const returnValue = [];
            for(let i = 0; i < result.length; i++) {
                returnValue.push({
                    pending_number: result[i].pending_number,
                    state: result[i].state,
                    problem_number: result[i].problem_number,
                    memory_usage: result[i].memory_usage,
                    time_usage: result[i].time_usage,
                    code_length: result[i].code.length,
                    language: result[i].language
                });
            }
            res.status(200).json({judge_result_list: returnValue});
        }).catch(err => {
        res.status(500).json({message: "server-error"});
    })
});

router.get('/getJudgeResultResultOne/:pendingNumber', (req, res, next) => {
    const user_id = mongoose.Types.ObjectId(req.decoded_token._id);
    let isTeacher = false;
    model.user.findOne().where('_id').equals(user_id)
        .then(result => {
            if(result === null) throw new Error('none-user');
            if(result.role === 1) isTeacher = true;
            return model.judge.findOne().where('pending_number').equals(req.params.pendingNumber)
        }).then(result => {
            if(result === null) throw new Error('none-pending-number');
            if(result.user_id === req.decoded_token._id || isTeacher) {
                const resultKey = Object.keys(result['_doc']);
                const returnValue = {};
                for(let i = 0; i < resultKey.length; i++) {
                    const key = resultKey[i];
                    if(key === '_id') continue;
                    if(key === 'user_id') continue;
                    if(key === '__v') continue;
                    returnValue[key] = result[key];
                }
                res.status(200).json(returnValue);
            }
            else throw new Error('judge-auth-fail');
        }).catch(err => {
            if(err.message === 'none-user') {
                res.status(403).json({message: "none-user"});
            }
            else if(err.message === 'none-pending-number') {
                res.status(404).json({message: "none-pending-number"});
            }
            else if(err.message === 'judge-auth-fail') {
                res.status(403).json({message: "judge-auth-fail"});
            }
            else {
                res.status(500).json({message: "server-error"});
            }
    })
});

module.exports = router;
