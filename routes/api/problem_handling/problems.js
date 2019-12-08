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
    let tmp = "";
    for(let i = 0; i < req.params.field.length; i++) {
        if(req.params.field[i] === '\\') tmp += '[' + '\\' + '\\' + ']';
        else tmp += '[' + req.params.field[i] + ']';
    }
    const re = new RegExp(tmp);
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
    let tmp = "";
    for(let i = 0; i < req.params.field.length; i++) {
        if(req.params.field[i] === '\\') tmp += '[' + '\\' + '\\' + ']';
        else tmp += '[' + req.params.field[i] + ']';
    }
    const re = new RegExp(tmp);
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

// 외부 문제 불러오기

router.get('/getOutProblemList/:oj/:page', (req, res, next) => {
    const page = req.params.page;
    const oj_re = new RegExp(req.params.oj);
    model.outProblem.find().where('problem_number').regex(oj_re).sort({"problem_number" : 1}).skip(page * 15 - 15).limit(15)
        .select({"_id": 0}).select('name').select('problem_number').select('Category').select('problem_rating')
        .then(result => {
            res.status(200).json({problem_list: result});
        }).catch(err => {
            res.status(500).json({message: "server-error"});
    });
});


router.get('/getOutProblemList/:oj/name/:field/:page', (req, res, next) => {
    const page = req.params.page;
    const oj_re = new RegExp(req.params.oj);

    let tmp = "";
    for(let i = 0; i < req.params.field.length; i++) {
        if(req.params.field[i] === '\\') tmp += '[' + '\\' + '\\' + ']';
        else tmp += '[' + req.params.field[i] + ']';
    }

    const field_re = new RegExp(tmp);

    model.outProblem.find().where('problem_number').regex(oj_re)
        .where('name').regex(field_re)
        .sort({"problem_number" : 1}).skip(page * 15 - 15).limit(15)
        .select({"_id": 0}).select('name').select('problem_number').select('Category').select('problem_rating')
        .then(result => {
            res.status(200).json({problem_list: result});
        }).catch(err => {
        res.status(500).json({message: "server-error"});
    });
});

router.get('/getOutProblemList/:oj/category/:field/:page', (req, res, next) => {
    const page = req.params.page;
    const oj_re = new RegExp(req.params.oj);

    let tmp = "";
    for(let i = 0; i < req.params.field.length; i++) {
        if(req.params.field[i] === '\\') tmp += '[' + '\\' + '\\' + ']';
        else tmp += '[' + req.params.field[i] + ']';
    }

    const field_re = new RegExp(tmp);

    model.outProblem.find().where('problem_number').regex(oj_re)
        .where('Category').regex(field_re)
        .sort({"problem_number" : 1}).skip(page * 15 - 15).limit(15)
        .select({"_id": 0}).select('name').select('problem_number').select('Category').select('problem_rating')
        .then(result => {
            res.status(200).json({problem_list: result});
        }).catch(err => {
        res.status(500).json({message: "server-error"});
    });
});

router.use(auth);

// SeaUCode 문제 추천

router.get('/getProblemList/recommend/:nickname/:difficulty/:page', (req, res, next) => {
    const page = req.params.page;
    model.judge.distinct("problem_number", {
        user_nickname: {$eq: req.params.nickname},
        state: {$eq: 2}
    }).then(result => {
        return model.problem.find()
            .where("problem_number").nin(result)
            .where('difficulty').gte(parseInt(req.params.difficulty))
            .lte(parseInt(req.params.difficulty) + 1)
            .where('delete_yn').equals(false).sort({"problem_number" : 1}).skip(page * 15 - 15).limit(15)
            .select({"_id": 0}).select('name').select('problem_number').select('Category')
    }).then(result => {
        res.status(200).json({problem_list: result});
    }).catch(err => {
        res.status(500).json({message: "server-error"});
    });
});

router.get('/getProblemList/recommend/:nickname/:difficulty/name/:field/:page', (req, res, next) => {
    const page = req.params.page;
    let tmp = "";
    for(let i = 0; i < req.params.field.length; i++) {
        if(req.params.field[i] === '\\') tmp += '[' + '\\' + '\\' + ']';
        else tmp += '[' + req.params.field[i] + ']';
    }
    const re = new RegExp(tmp);

    model.judge.distinct("problem_number", {
        user_nickname: {$eq: req.params.nickname},
        state: {$eq: 2}
    }).then(result => {
        return model.problem.find().where('name').regex(re)
            .where("problem_number").nin(result)
            .where('difficulty').gte(parseInt(req.params.difficulty))
            .lte(parseInt(req.params.difficulty) + 1)
            .where('delete_yn').equals(false).sort({"problem_number" : 1}).skip(page * 15 - 15).limit(15)
            .select({"_id": 0}).select('name').select('problem_number').select('Category')
    }).then(result => {
        res.status(200).json({problem_list: result});
    }).catch(err => {
        res.status(500).json({message: "server-error"});
    });
});

router.get('/getProblemList/recommend/:nickname/:difficulty/category/:field/:page', (req, res, next) => {
    const page = req.params.page;
    let tmp = "";
    for(let i = 0; i < req.params.field.length; i++) {
        if(req.params.field[i] === '\\') tmp += '[' + '\\' + '\\' + ']';
        else tmp += '[' + req.params.field[i] + ']';
    }
    const re = new RegExp(tmp);

    model.judge.distinct("problem_number", {
        user_nickname: {$eq: req.params.nickname},
        state: {$eq: 2}
    }).then(result => {
        return model.problem.find().where('Category').regex(re)
            .where("problem_number").nin(result)
            .where('difficulty').gte(parseInt(req.params.difficulty))
            .lte(parseInt(req.params.difficulty) + 1)
            .where('delete_yn').equals(false).sort({"problem_number" : 1}).skip(page * 15 - 15).limit(15)
            .select({"_id": 0}).select('name').select('problem_number').select('Category')
    }).then(result => {
        res.status(200).json({problem_list: result});
    }).catch(err => {
        res.status(500).json({message: "server-error"});
    });
});

// 추천 문제 필터링
router.get('/getOutProblemList/:oj/recommend/:nickname/:difficulty/:page', (req, res, next) => {
    const page = req.params.page;
    const oj_re = new RegExp(req.params.oj);

    model.user.findOne().where("nickname").equals(req.params.nickname).then(result => {
        if(result === null) throw new Error('not-user');
        let oj_id = result.boj_id;
        if(req.params.oj === 'spoj') oj_id = result.spoj_id;
        if(req.params.oj === 'codeforces') oj_id = result.codeforces_id;
        return model.outJudgeResult.find().where('oj').equals(req.params.oj)
            .where('oj_id').equals(oj_id);
    }).then(result => {
        const arr = [];
        for(let i = 0; i < result.length; i++) {
            arr.push(result[i].problem_number);
        }
        if(req.params.oj === 'codeforces') {
            return model.outProblem.find().where("problem_number").nin(arr)
                .where("problem_number").regex(oj_re)
                .where('problem_rating').gte(parseInt(req.params.difficulty))
                .lte(parseInt(req.params.difficulty) + 100)
                .sort({"problem_solver": -1})
                .sort({"problem_number": 1}).skip(page * 15 - 15).limit(15)
                .select({"_id": 0}).select('name').select('problem_number').select('Category').select('problem_rating');
        }
        else if(req.params.oj === 'boj') {
            return model.outProblem.find().where("problem_number").nin(arr)
                .where("problem_number").regex(oj_re)
                .where('problem_rating').gte(parseInt(req.params.difficulty))
                .lte(parseInt(req.params.difficulty) + 1)
                .sort({"problem_solver": -1})
                .sort({"problem_number": 1}).skip(page * 15 - 15).limit(15)
                .select({"_id": 0}).select('name').select('problem_number').select('Category').select('problem_rating');
        }
        else {
            return model.outProblem.find().where("problem_number").nin(arr)
                .where("problem_number").regex(oj_re)
                .where('problem_rating').gte(parseInt(req.params.difficulty))
                .lte(parseInt(req.params.difficulty) + 2)
                .sort({"problem_solver": -1})
                .sort({"problem_number": 1}).skip(page * 15 - 15).limit(15)
                .select({"_id": 0}).select('name').select('problem_number').select('Category').select('problem_rating');
        }
    }).then(result => {
        res.status(200).json({problem_list: result});
    }).catch(err => {
        res.status(500).json({message: "server-error"});
    });
});

// 추천 문제 카테고리 필터링
router.get('/getOutProblemList/:oj/recommend/:nickname/:difficulty/category/:field/:page', (req, res, next) => {
    const page = req.params.page;
    const oj_re = new RegExp(req.params.oj);

    let tmp = "";
    for(let i = 0; i < req.params.field.length; i++) {
        if(req.params.field[i] === '\\') tmp += '[' + '\\' + '\\' + ']';
        else tmp += '[' + req.params.field[i] + ']';
    }

    const field_re = new RegExp(tmp);

    model.user.findOne().where("nickname").equals(req.params.nickname).then(result => {
        if(result === null) throw new Error('not-user');
        let oj_id = result.boj_id;
        if(req.params.oj === 'spoj') oj_id = result.spoj_id;
        if(req.params.oj === 'codeforces') oj_id = result.codeforces_id;
        return model.outJudgeResult.find().where('oj').equals(req.params.oj)
            .where('oj_id').equals(oj_id);
    }).then(result => {
            const arr = [];
            for(let i = 0; i < result.length; i++) {
                arr.push(result[i].problem_number);
            }
            if(req.params.oj === 'codeforces') {
                return model.outProblem.find().where("problem_number").nin(arr)
                    .where("problem_number").regex(oj_re)
                    .where('problem_rating').gte(parseInt(req.params.difficulty))
                    .lte(parseInt(req.params.difficulty) + 100)
                    .where('Category').regex(field_re)
                    .sort({"problem_solver": -1})
                    .sort({"problem_number": 1}).skip(page * 15 - 15).limit(15)
                    .select({"_id": 0}).select('name').select('problem_number').select('Category').select('problem_rating');
            }
            else if(req.params.oj === 'boj') {
                return model.outProblem.find().where("problem_number").nin(arr)
                    .where("problem_number").regex(oj_re)
                    .where('problem_rating').gte(parseInt(req.params.difficulty))
                    .lte(parseInt(req.params.difficulty) + 1)
                    .where('Category').regex(field_re)
                    .sort({"problem_solver": -1})
                    .sort({"problem_number": 1}).skip(page * 15 - 15).limit(15)
                    .select({"_id": 0}).select('name').select('problem_number').select('Category').select('problem_rating');
            }
            else {
                return model.outProblem.find().where("problem_number").nin(arr)
                    .where("problem_number").regex(oj_re)
                    .where('problem_rating').gte(parseInt(req.params.difficulty))
                    .lte(parseInt(req.params.difficulty) + 2)
                    .where('Category').regex(field_re)
                    .sort({"problem_solver": -1})
                    .sort({"problem_number": 1}).skip(page * 15 - 15).limit(15)
                    .select({"_id": 0}).select('name').select('problem_number').select('Category').select('problem_rating');
            }
        }).then(result => {
            res.status(200).json({problem_list: result});
    }).catch(err => {
        res.status(500).json({message: "server-error"});
    });
});


// 추천 문제 이름 필터링
router.get('/getOutProblemList/:oj/recommend/:nickname/:difficulty/name/:field/:page', (req, res, next) => {
    const page = req.params.page;
    const oj_re = new RegExp(req.params.oj);

    let tmp = "";
    for(let i = 0; i < req.params.field.length; i++) {
        if(req.params.field[i] === '\\') tmp += '[' + '\\' + '\\' + ']';
        else tmp += '[' + req.params.field[i] + ']';
    }

    const field_re = new RegExp(tmp);

    model.user.findOne().where("nickname").equals(req.params.nickname).then(result => {
        if(result === null) throw new Error('not-user');
        let oj_id = result.boj_id;
        if(req.params.oj === 'spoj') oj_id = result.spoj_id;
        if(req.params.oj === 'codeforces') oj_id = result.codeforces_id;
        return model.outJudgeResult.find().where('oj').equals(req.params.oj)
            .where('oj_id').equals(oj_id);
    }).then(result => {
        const arr = [];
        for(let i = 0; i < result.length; i++) {
            arr.push(result[i].problem_number);
        }
        if(req.params.oj === 'codeforces') {
            return model.outProblem.find().where("problem_number").nin(arr)
                .where("problem_number").regex(oj_re)
                .where('problem_rating').gte(parseInt(req.params.difficulty))
                .lte(parseInt(req.params.difficulty) + 100)
                .where('name').regex(field_re)
                .sort({"problem_solver": -1})
                .sort({"problem_number": 1}).skip(page * 15 - 15).limit(15)
                .select({"_id": 0}).select('name').select('problem_number').select('Category').select('problem_rating');
        }
        else if(req.params.oj === 'boj') {
            return model.outProblem.find().where("problem_number").nin(arr)
                .where("problem_number").regex(oj_re)
                .where('problem_rating').gte(parseInt(req.params.difficulty))
                .lte(parseInt(req.params.difficulty) + 1)
                .where('name').regex(field_re)
                .sort({"problem_solver": -1})
                .sort({"problem_number": 1}).skip(page * 15 - 15).limit(15)
                .select({"_id": 0}).select('name').select('problem_number').select('Category').select('problem_rating');
        }
        else {
            return model.outProblem.find().where("problem_number").nin(arr)
                .where("problem_number").regex(oj_re)
                .where('problem_rating').gte(parseInt(req.params.difficulty))
                .lte(parseInt(req.params.difficulty) + 2)
                .where('name').regex(field_re)
                .sort({"problem_solver": -1})
                .sort({"problem_number": 1}).skip(page * 15 - 15).limit(15)
                .select({"_id": 0}).select('name').select('problem_number').select('Category').select('problem_rating');
        }
    }).then(result => {
        res.status(200).json({problem_list: result});
    }).catch(err => {
        res.status(500).json({message: "server-error"});
    });
});
 
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


module.exports = router;
