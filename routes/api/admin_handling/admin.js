const express = require('express');
const router = express.Router();

const model = require('../../../models/model.js');
const mongoose = require('mongoose');
const multer = require('multer');

const bodyParser = require('body-parser');
const path = require('path');

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
            if(result.role !== 3) throw new Error('not-admin');
            next();
        }).catch(err => {
            if(err.message === 'none-user') {
                res.status(403).json({message:'none-user'});
            }
            else if(err.message === 'not-admin') {
                res.status(403).json({message:'not-admin'});
            }
            else res.status(500).json({message:'server-error'});
    });
});

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, __dirname);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});
const upload = multer({ storage: storage }).array('files', 11);

router.post('/addProblem', (req, res, next) => {
    upload(req, res, function(err) {
        if(err) {
            console.log(err);
        }
        const newInputList = req.body.input_list.concat();
        const newOutputList = req.body.output_list.concat();
        for(let i = 0; i < newInputList.length; i++) {
            newInputList[i] = {"_id" : i + 1, "txt": newInputList[i]};
            newOutputList[i] = {"_id" : i + 1, "txt": newOutputList[i]};
        }
        console.log(newInputList);
        const addProblem = model.problem({
            name: req.body.name,
            problem_description : req.body.problem_description,
            sample_input : req.body.sample_input,
            sample_output : req.body.sample_output,
            input_description : req.body.input_description,
            output_description : req.body.output_description,
            solution : req.body.solution,
            difficulty : req.body.difficulty,
            Category : req.body.Category,
            input_list: newInputList,
            output_list: newOutputList,
            spj: req.body.spj,
            spj_code: req.body.spj_code,
            delete_yn : false,
            memory_limit: req.body.memory_limit * 1024 * 1024,
            time_limit: req.body.time_limit * 1000
        });
        console.log(addProblem);
        /*addProblem.save()
            .then(result => {
                res.status(200).json({message: "success"});
            }).catch(err => {
                res.status(500).json({message: "server-error"});
        });*/
        res.status(200).json({message:"success"});
    });
});

router.post('/updateProblem', (req, res, next) => {
    res.status(200).json({message: "success"});
});

module.exports = router;
