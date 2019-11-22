const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const model = require('../../../models/model.js');

const bodyParser = require('body-parser');

const auth = require('../../middleware/auth.js');

router.use(bodyParser.urlencoded({
    extended: false
}));
router.use(auth);

router.get('/getProblemDescription/:problemId', (req, res, next) => {
    const problem_id = req.params.problemId;
    model.problem.findOne()
        .where('problem_number').equals(problem_id)
        .then(result => {
            if(result == null) throw new Error('not-exist-problem');
            res.status(200).json({
                "name": result.name,
                "problem_description": result.problem_description,
                "sample_input": result.sample_input,
                "sample_output": result.sample_output,
                "time_limit": result.time_limit,
                "memory_limit": result.memory_limit,
                "spj": result.spj,
                "difficulty": result.difficulty,
                "category": result.Category,
                "input_description": result.input_description,
                "output_description": result.output_description
            });
        }).catch(err => {
            if(err.message === "not-exist-problem") {
                res.status(404).json({message: "not-exist-problem"});
            }
            else {
                res.status(500).json({message: "server-error"});
            }
    });
});

router.get('/getProblemList/:page', (req, res, next) => {
    const page = req.params.page;
    model.problem.find().sort({"problem_number" : 1}).skip(page * 15 - 15).limit(15)
        .select({"_id": 0}).select('name').select('problem_number').select('Category')
        .then(result => {
            res.status(200).json({problem_list: result});
        }).catch(err => {
            res.status(500).json({message: "server-error"});
    });
});

router.get('/getProblemList/name/:field/:page', (req, res, next) => {
    const re = new RegExp(req.params.field);
    model.problem.find().where('name').regex(re)
        .sort({"problem_number": 1}).skip(req.params.page * 15 - 15).limit(15)
        .select({"_id":0}).select('name').select('problem_number').select('Category')
        .then(result => {
            res.status(200).json({problem_list: result});
        }).catch(err => {
            res.status(500).json({message: "server-error"});
    });
});

router.get('/getProblemList/category/:field/:page', (req, res, next) => {
    const re = new RegExp(req.params.field);
    model.problem.find().where('Category').regex(re)
        .sort({"problem_number": 1}).skip(req.params.page * 15 - 15).limit(15)
        .select({"_id":0}).select('name').select('problem_number').select('Category')
        .then(result => {
            res.status(200).json({problem_list: result});
        }).catch(err => {
        res.status(500).json({message: "server-error"});
    });
});



//27-2 과제 목록을 요청(GET)받으면 해당 학생의 모든 과제목록을 반환한다.
router.get('/getAllAssignment',function(req,res,next){
    const user_id = mongoose.Types.ObjectId(req.decoded_token._id);

    model.assignment.find()
    .where('user_id').equals(user_id)
    .then(result => {
        res.status(200).json(result);
    }).catch(err => {
        res.status(500).json({message : 'server-error'});
    });

});
//28-2 과제 목록을 요청(GET)받으면 해당 학생의 반 id에 속하는 과제 목록을 반환한다.
router.get('/getClassAssignment/:id',function(req,res,next){
    
    const user_id = mongoose.Types.ObjectId(req.decoded_token._id);
    const class_id = mongoose.Types.ObjectId(req.params.id);

    model.classroom.find()
    .where('_id').equals(class_id)
    .then(result => {
        return model.assignment.find()
        .where('classroom_name').equals(result.name)
        .where('user_id').equals(user_id);
    }).then(result =>{
        res.status(200).json(result);
    }).catch(err => {
        res.status(500).json({message : 'server-error'});
    });

});

 
//20-2
//넘어오는 body 값들 problem_number,assignment의 네임, 시작 끝 기간, classroom_id
router.post('/setAssignment',(req,res,next) => {
    const user_id = mongoose.Types.ObjectId(req.decoded_token._id);
    const classroom_id = mongoose.Types.ObjectId(req.body.classroom_id);

    model.user.findOne()
    .where('_id').equals(user_id)
    .then(result => {
        if(result ===null) throw new Error('invalid token');
        const nickname = result.nickname;
        
        model.classroom.findOne()
        .where('_id').equals(classroom_id)
        .then(result => {
            const classroom_name = result.name;

            model.problem.find()
            .where('problem_number').equals(req.body.problemnumber)
            .then(result => {
                const save_assignment = model.assignment({
                    user_id : user_id,
                    name  : req.body.name,
                    problem_list : result.problem_number,
                    start_date : req.body.start_date,
                    end_date : req.body.end_date,
                    classroom_name : classroom_name,
                    teacher_nickname : nickname
                });
            return save_assignment.save();
            });
        });
    }).then(result => {    
        res.status(200).json({message : 'assignment is created'});
    }).catch(err => {
        res.status(500).json({message : "server-error"});
    });
});

//22-2 특정 문제 번호를 파라미터로 하여 요청(GET) 받으면 그 문제의 디스크립션과 입출력 예제를 반환한다.
router.get('/getDescription/:problem_number',function(req,res,next){

    const pro_number = req.params.problem_number;
    const respons = {problem_description : [] , sample_input : [], sample_output : []};


    model.problem.find()
        .where('problem_number').equals(pro_number)
        .then(result => {
            if(result === null) throw new error('no problem has been exist');

            respons.problem_description = result.problem_description;
            respons.sample_input = result.sample_input;
            respons.sample_output = result.sample_output;

        }).then(result =>{
        res.status(200).json(respons);
    }).catch(err => {
        res.status(500).json({message : 'server-error'});
    });

});


module.exports = router;
