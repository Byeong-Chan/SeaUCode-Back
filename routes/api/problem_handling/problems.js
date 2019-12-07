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
        .where('delete_yn').equals(false)
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
    model.problem.find()
        .where('delete_yn').equals(false).sort({"problem_number" : 1}).skip(page * 15 - 15).limit(15)
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
        .where('delete_yn').equals(false)
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
        .where('delete_yn').equals(false)
        .sort({"problem_number": 1}).skip(req.params.page * 15 - 15).limit(15)
        .select({"_id":0}).select('name').select('problem_number').select('Category')
        .then(result => {
            res.status(200).json({problem_list: result});
        }).catch(err => {
        res.status(500).json({message: "server-error"});
    });
});



router.use(auth);

 
//20-2
//넘어오는 body 값들 problem_number,assignment의 네임, 시작 끝 기간, classroom_id
router.post('/setAssignment',(req,res,next) => {
    const user_id = mongoose.Types.ObjectId(req.decoded_token._id);
    const classroom_id = mongoose.Types.ObjectId(req.body.classroom_id);

    const assignment_obj = {
        user_nickname: req.body.user_nickname,
        name: req.body.name,
        problem_list: req.body.problem_list,
        start_date: req.body.start_date,
        end_date: req.body.end_date,
        classroom_name: '',
        teacher_nickname: '',
        class_id: req.body.classroom_id
    };

    model.user.findOne().where('_id').equals(user_id).then(result => {
        if(result === null) throw new Error('invalid-token');
        assignment_obj.teacher_nickname = result.nickname;
        return model.classroom.findOne().where('_id').equals(classroom_id)
            .where('classroom_owner').equals(result.nickname)
            .where('user_list').equals(req.body.user_nickname);
    }).then(result => {
        if(result === null) throw new Error('class-auth-fail');
        assignment_obj.classroom_name = result.name;
        return model.assignment(assignment_obj).save();
    }).then(result => {
        res.status(200).json({message:"success"});
    }).catch(err => {
        if(err.message === 'invalid-token') res.status(403).json({message: 'invalid-token'});
        else if(err.message === 'class-auth-fail') res.status(403).json({message: 'class-auth-fail'});
        else res.status(500).json({message: 'server-error'});
    });
});
router.post('/updateAssignment',(req,res,next) => {
    const user_id = mongoose.Types.ObjectId(req.decoded_token._id);
    const classroom_id = mongoose.Types.ObjectId(req.body.classroom_id);
    const assignment_id = mongoose.Types.ObjectId(req.body.assignment_id);

    const assignment_obj = {
        user_nickname: req.body.user_nickname,
        name: req.body.name,
        problem_list: req.body.problem_list,
        start_date: req.body.start_date,
        end_date: req.body.end_date,
        classroom_name: '',
        teacher_nickname: '',
        class_id: req.body.classroom_id
    };

    model.user.findOne().where('_id').equals(user_id).then(result => {
        if(result === null) throw new Error('invalid-token');
        assignment_obj.teacher_nickname = result.nickname;
        return model.classroom.findOne().where('_id').equals(classroom_id)
            .where('classroom_owner').equals(result.nickname)
            .where('user_list').equals(req.body.user_nickname);
    }).then(result => {
        if(result === null) throw new Error('class-auth-fail');
        assignment_obj.classroom_name = result.name;
        return model.assignment.updateOne().where('_id').equals(assignment_id).set(assignment_obj);
    }).then(result => {
        res.status(200).json({message:"success"});
    }).catch(err => {
        if(err.message === 'invalid-token') res.status(403).json({message: 'invalid-token'});
        else if(err.message === 'class-auth-fail') res.status(403).json({message: 'class-auth-fail'});
        else res.status(500).json({message: 'server-error'});
    });
});

router.delete('/deleteAssignment/:id', (req, res, next) => {
    const user_id = mongoose.Types.ObjectId(req.decoded_token._id);
    const assignment_id = mongoose.Types.ObjectId(req.params.id);
    const info = {};
    
    model.user.findOne().where('_id').equals(user_id).then(result => {
        if (result === null) throw new Error('invalid-token');
        info.teacher_nickname = result.nickname;
        return model.assignment.findOne().where('_id').equals(assignment_id);
    }).then(result => {
        if (result === null) throw new Error('not-assignment');
        if (result.teacher_nickname !== info.teacher_nickname) throw new Error('teacher-auth-fail');
        return model.assignment.deleteOne().where('_id').equals(assignment_id);
    }).then(result => {
        res.status(200).json({message: "success"});
    }).catch(err => {
        if(err.message === 'invalid-token')
            res.status(403).json({message: 'invalid-token'});
        else if(err.message === 'not-assignment')
            res.status(404).json({message: 'not-assignment'});
        else if(err.message === 'teacher-auth-fail')
            res.status(403).json({message: 'teacher-auth-fail'});
        else
            res.status(500).json({message: 'server-error'});
    });
});

//22-2 특정 문제 번호를 파라미터로 하여 요청(GET) 받으면 그 문제의 디스크립션과 입출력 예제를 반환한다.
router.get('/getDescription/:problem_number',function(req,res,next){

    const pro_number = req.params.problem_number;
    const respons = {problem_description : [] , sample_input : [], sample_output : []};


    model.problem.findOne()
        .where('problem_number').equals(pro_number)
        .where('delete_yn').equals(false)
        .then(result => {
            if(result === null) throw new Error('no problem has been exist');

            respons.problem_description = result.problem_description;
            respons.sample_input = result.sample_input;
            respons.sample_output = result.sample_output;

        }).then(result =>{
        res.status(200).json(respons);
    }).catch(err => {
        if(err.message === 'no problem has been exist'){
            res.status(400).json({message : 'problem do not exist'});
        }
        else{
        res.status(500).json({message : 'server-error'});
        }
    });

});


//기존의 문제를 반환하는 방식을 (난이도/카테고리/문제이름/문제번호)로 15개씩 반환해주는 방식으로 수정한다.

router.get('/getProblemList/outProblem/:page', (req, res, next) => {
    const page = req.params.page;
    const ProblemValue = [];
    const OutProblemValue = [];
    model.problem.find()
        .where('delete_yn').equals(false)
        .select({"_id":0}).select('name').select('problem_number').select('Category').select('difficulty')
        .then(result => {
            
            for(let i = 0; i < result.length; i++) {
                ProblemValue.push({
                    name : result[i].name,
                    problem_number : result[i].problem_number,
                    Category : result[i].Category,
                    difficulty : result[i].difficulty
                });
            }
            return model.outProblem.find()
            .select({"_id":0}).select('name').select('problem_number').select('Category').select('difficulty');
        }).then(result=> {
            for(let i = 0; i < result.length; i++) {
                OutProblemValue.push({
                    name : result[i].name,
                    problem_number : result[i].problem_number,
                    Category : result[i].Category,
                    difficulty : result[i].difficulty
                });
            }
            const problem_added = ProblemValue.concat(OutProblemValue);
            const problem_list  = problem_added.slice(page*15-15,page*15-1);
            res.status(200).json({problem_list: problem_list});
        }).catch(err => {
            res.status(500).json({message: "server-error"});
    });
});

router.get('/getProblemList/outProblem/name/:field/:page', (req, res, next) => {
    const re = new RegExp(req.params.field);
    const page = req.params.page;
    const ProblemValue = [];
    const OutProblemValue = [];
    model.problem.find()
        .where('delete_yn').equals(false).where('name').regex(re)
        .select({"_id":0}).select('name').select('problem_number').select('Category').select('difficulty')
        .then(result => {
            
            for(let i = 0; i < result.length; i++) {
                ProblemValue.push({
                    name : result[i].name,
                    problem_number : result[i].problem_number,
                    Category : result[i].Category,
                    difficulty : result[i].difficulty
                });
            }
            return model.outProblem.find().where('name').regex(re)
            .select({"_id":0}).select('name').select('problem_number').select('Category').select('difficulty');
        }).then(result=> {
            for(let i = 0; i < result.length; i++) {
                OutProblemValue.push({
                    name : result[i].name,
                    problem_number : result[i].problem_number,
                    Category : result[i].Category,
                    difficulty : result[i].difficulty
                });
            }
            const problem_added = ProblemValue.concat(OutProblemValue);
            const problem_list  = problem_added.slice(page*15-15,page*15-1);
            res.status(200).json({problem_list: problem_list});
        }).catch(err => {
            res.status(500).json({message: "server-error"});
    });
});

router.get('/getProblemList/outProblem/Category/:field/:page', (req, res, next) => {
    const re = new RegExp(req.params.field);
    const page = req.params.page;
    const ProblemValue = [];
    const OutProblemValue = [];
    model.problem.find()
        .where('delete_yn').equals(false).where('Category').regex(re)
        .select({"_id":0}).select('name').select('problem_number').select('Category').select('difficulty')
        .then(result => {
            
            for(let i = 0; i < result.length; i++) {
                ProblemValue.push({
                    name : result[i].name,
                    problem_number : result[i].problem_number,
                    Category : result[i].Category,
                    difficulty : result[i].difficulty
                });
            }
            return model.outProblem.find().where('Category').regex(re)
            .select({"_id":0}).select('name').select('problem_number').select('Category').select('difficulty');
        }).then(result=> {
            for(let i = 0; i < result.length; i++) {
                OutProblemValue.push({
                    name : result[i].name,
                    problem_number : result[i].problem_number,
                    Category : result[i].Category,
                    difficulty : result[i].difficulty
                });
            }
            const problem_added = ProblemValue.concat(OutProblemValue);
            const problem_list  = problem_added.slice(page*15-15,page*15-1);
            res.status(200).json({problem_list: problem_list});
        }).catch(err => {
            res.status(500).json({message: "server-error"});
    });
});

router.get('/getProblemList/outProblem/difficulty/:field/:page', (req, res, next) => {
    const re = new RegExp(req.params.field);
    const page = req.params.page;
    const ProblemValue = [];
    const OutProblemValue = [];
    model.problem.find()
        .where('delete_yn').equals(false).where('difficulty').regex(re)
        .select({"_id":0}).select('name').select('problem_number').select('Category').select('difficulty')
        .then(result => {
            
            for(let i = 0; i < result.length; i++) {
                ProblemValue.push({
                    name : result[i].name,
                    problem_number : result[i].problem_number,
                    Category : result[i].Category,
                    difficulty : result[i].difficulty
                });
            }
            return model.outProblem.find().where('difficulty').regex(re)
            .select({"_id":0}).select('name').select('problem_number').select('Category').select('difficulty');
        }).then(result=> {
            for(let i = 0; i < result.length; i++) {
                OutProblemValue.push({
                    name : result[i].name,
                    problem_number : result[i].problem_number,
                    Category : result[i].Category,
                    difficulty : result[i].difficulty
                });
            }
            const problem_added = ProblemValue.concat(OutProblemValue);
            const problem_list  = problem_added.slice(page*15-15,page*15-1);
            res.status(200).json({problem_list: problem_list});
        }).catch(err => {
            res.status(500).json({message: "server-error"});
    });
});

router.get('/getProblemList/outProblem/problem_number/:field/:page', (req, res, next) => {
    const re = new RegExp(req.params.field);
    const page = req.params.page;
    const ProblemValue = [];
    const OutProblemValue = [];
    model.problem.find()
        .where('delete_yn').equals(false).where('problem_number').regex(re)
        .select({"_id":0}).select('name').select('problem_number').select('Category').select('difficulty')
        .then(result => {
            
            for(let i = 0; i < result.length; i++) {
                ProblemValue.push({
                    name : result[i].name,
                    problem_number : result[i].problem_number,
                    Category : result[i].Category,
                    difficulty : result[i].difficulty
                });
            }
            return model.outProblem.find().where('problem_number').regex(re)
            .select({"_id":0}).select('name').select('problem_number').select('Category').select('difficulty');
        }).then(result=> {
            for(let i = 0; i < result.length; i++) {
                OutProblemValue.push({
                    name : result[i].name,
                    problem_number : result[i].problem_number,
                    Category : result[i].Category,
                    difficulty : result[i].difficulty
                });
            }
            const problem_added = ProblemValue.concat(OutProblemValue);
            const problem_list  = problem_added.slice(page*15-15,page*15-1);
            res.status(200).json({problem_list: problem_list});
        }).catch(err => {
            res.status(500).json({message: "server-error"});
    });
});


module.exports = router;
