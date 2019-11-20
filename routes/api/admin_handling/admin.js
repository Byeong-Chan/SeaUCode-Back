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

router.use((req, res, next) => {
    model.user.findOne()
        .where('_id').equals(mongoose.Types.ObjectId(req.decoded_token._id))
        .then(result => {
            if(result === null) throw new Error('none-user');
            if(result.role === 3) throw new Error('not-admin');
            next();
        }).catch(err => {
            if(err.message == 'none-user') {
                res.status(403).json({message:'none-user'});
            }
            else if(err.message === 'not-admin') {
                res.status(403).json({message:'not-admin'});
            }
            else res.status(500).json({message:'server-error'});
    });
});

router.post('/addProblem', (req, res, next) => {
    const addProblem = model.problem({
        name: req.body.name,
        problem_description : req.body.problem_description,
        sample_input : req.body.sample_input,
        sample_output : req.body.sample_output,
        input_description : req.body.input_description,
        output_description : req.body.output_description,
        solution : req.body.solution,
        difficulty : req.body.difficulty,
        Category : req.body.category,
        input_list: req.body.input_list,
        output_list: req.body.output_list,
        spj: req.body.spj,
        spj_code: req.body.spj_code,
        delete_yn : false,
        memory_limit: req.body.memory_limit * 1024 * 1024,
        time_limit: req.body.time_limit * 1000
    });
    addProblem.save()
        .then(result => {
            res.status(200).json({message: "success"});
        }).catch(err => {
            res.status(500).json({message: "server-error"});
    });
});

router.post('/updateProblem', (req, res, next) => {
    res.status(200).json({message: "success"});
});

module.exports = router;
