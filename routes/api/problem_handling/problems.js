const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const model = require('../../../models/model.js');

const bodyParser = require('body-parser');

const auth = require('../../middleware/auth.js');

router.use(bodyParser.urlencoded({
    extended: false
}));

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

 //19-2 문제번호,문제 이름, 알고리즘 종류
router.get('/getProblemInfo',(req,res,next) => {
    model.problem.find()
    .select({"_id":0}).select('name').select('problem_number').select('Category')
    .then(result => {
        res.status(200).json({'problem_info' : result});
    }).catch(err =>{
        res.status(500).json({message: "server error"});
    });
});
//20-2과제에 포함될 문제목록과 기한과 이름을 DB에 저장한다. 이후 성공메시지를 반환한다.
//problem number가 넘어오는지
router.post('/setAssginment',(req,res,next) => {
    const user_id = mongoose.Types.ObjectId(req.decode_token._id);
    
    model.problem.find()
    .where('').equals()
    .then(result => {
        const save_assignment = model.assignment({
            user_id : user_id,
            name  : req.body.name,
            problem_list : [],
            start_date : req.body.start_date,
            end_date : req.body.end_date,
            classroom_name : a,
            teacher_nickname : a
        });
        
        save_assignment.problem_list.push(result.problem_number);
        
        return save_assignment.save();
    }).then(result => {
        res.status(200).json({message : 'assignment is created'});
    }).catch(err => {
        res.status(500).json({message : "server-error"});
    });

});

//27-2 과제 목록을 요청(GET)받으면 해당 학생의 모든 과제목록을 반환한다.
router.get('/getAllAssignment',function(req,res,next){
    const user_id = mongoose.Types.ObjectId(req.decode_token._id);

    model.assignment.find()
    .where('user_id').equals(user_id)
    .then(result => {
        res.status(200).json(result);
    }).catch(err => {
        res.status(500).json({message : 'server-error'});
    })

});
//28-2 과제 목록을 요청(GET)받으면 해당 학생의 반 id에 속하는 과제 목록을 반환한다.
router.get('/getClassAssignment/:id',function(req,res,next){
    
    const user_id = mongoose.Types.ObjectId(req.decode_token._id);
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
module.exports = router;
