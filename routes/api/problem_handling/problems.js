const express = require('express');
const router = express.Router();

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

router.post('/getProblemList/name', (req, res, next) => {
    const re = new RegExp(req.body.field);
    model.problem.find().where('name').regex(re)
        .sort({"problem_number": 1}).skip(req.body.page * 15 - 15).limit(15)
        .select({"_id":0}).select('name').select('problem_number').select('Category')
        .then(result => {
            res.status(200).json({problem_list: result});
        }).catch(err => {
            res.status(500).json({message: "server-error"});
    });
});

router.post('/getProblemList/category', (req, res, next) => {
    const re = new RegExp(req.body.field);
    model.problem.find().where('Category').regex(re)
        .sort({"problem_number": 1}).skip(req.body.page * 15 - 15).limit(15)
        .select({"_id":0}).select('name').select('problem_number').select('Category')
        .then(result => {
            res.status(200).json({problem_list: result});
        }).catch(err => {
        res.status(500).json({message: "server-error"});
    });
});

module.exports = router;
