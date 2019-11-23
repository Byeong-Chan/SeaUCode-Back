const express = require('express');
const router = express.Router();

const model = require('../../../models/model.js');
const mongoose = require('mongoose');
const multer = require('multer');

const bodyParser = require('body-parser');
const fs = require('fs');

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
            res.status(500).json({message:"server-error"});
        }

        if(req.body.input_list === undefined) req.body.input_list = [];
        if(req.body.output_list === undefined) req.body.output_list = [];
        if(req.body.Category === undefined) req.body.Category = [];
        const newInputList = [].concat(req.body.input_list);
        const newOutputList = [].concat(req.body.output_list);
        const newCategory = [].concat(req.body.Category);

        for(let i = 0; i < newInputList.length; i++) {
            newInputList[i] = {"_id" : i + 1, "txt": newInputList[i]};
            newOutputList[i] = {"_id" : i + 1, "txt": newOutputList[i]};
        }
        const addProblem = model.problem({
            name: req.body.name,
            problem_description : req.body.problem_description,
            sample_input : req.body.sample_input,
            sample_output : req.body.sample_output,
            input_description : req.body.input_description,
            output_description : req.body.output_description,
            solution : '',
            difficulty : req.body.difficulty,
            Category : newCategory,
            input_list: newInputList,
            output_list: newOutputList,
            spj: req.body.spj,
            spj_code: req.body.spj_code,
            delete_yn : false,
            memory_limit: req.body.memory_limit * 1024 * 1024,
            time_limit: req.body.time_limit * 1000
        });

        const cpfile = function(filepath, filename, problem_number) {
            new Promise((resolve, reject) => {
                fs.mkdir(path.join(__dirname, `../../../public/assets/${problem_number}/`), { recursive: true }, err => {
                    if(err) reject(err);
                    else {
                        fs.copyFile(filepath, path.join(__dirname, `../../../public/assets/${problem_number}/${filename}`), err => {
                            if (err) reject(err);
                            else {
                                fs.unlink(filepath, err => {
                                    if (err) reject(err);
                                    else {
                                        if (filename.slice(-3) === 'pdf') {
                                            model.problem.updateOne({problem_number: problem_number},
                                                {
                                                    $set: {
                                                        "solution":
                                                            path.join(__dirname, `../../../public/assets/${problem_number}/${filename}`)
                                                    }
                                                }, {updated :true})
                                                .then(result => {
                                                    resolve(result);
                                                }).catch(err => {
                                                reject(err);
                                            });
                                        }
                                        else resolve();
                                    }
                                });
                            }
                        });
                    }
                });
            }).catch(err => {
                console.log(err);
            });
        };

        addProblem.save()
            .then(result => {
                for(let i = 0; i < req.files.length; i++) {
                    cpfile(req.files[i].path, req.files[i].filename, result.problem_number);
                }
                res.status(200).json({message: "success"});
            }).catch(err => {
                console.log(err);
                res.status(500).json({message: "server-error"});
        });
    });
});

router.post('/updateProblem', (req, res, next) => {
    const problem_number = req.body.problem_number;
    const problem_obj =req.body.problem_info;
    
    model.problem.findOne()
    .where('problem_number').equals(problem_number)
    .then(result => {
        if(result.input_list._id === problem_obj.input_list._id){
            return model.problem.updateOne({'problem_number' :problem_number,'input_list._id':problem_obj.input_list._id}, {$set:{input_list : problem_obj.input_list}},{updated : true});
        }
        else{
            return model.problem.updateOne({'problem_number' :problem_number,'input_list._id':problem_obj.input_list._id},{$addToSet: {input_list : {$each : problem_obj.input_list}}},{updated : true});
        }
    }).then(result =>{
        if(result.nModified) throw new Error('inputlist update failure');
        if(result.n) throw new Error('No problem found');
    }).then(() =>
        model.problem.findOne()
        .where('problem_number').equals(problem_number)
        .then(result => {
            if(result.output_list._id === problem_obj.output_list._id){
                return model.problem.updateOne({'problem_number' :problem_number,'output_list._id':problem_obj.output_list._id}, {$set:{output_list : problem_obj.output_list}},{updated : true});
            }
            else{
                return model.problem.updateOne({'problem_number' :problem_number,'output_list._id':problem_obj.output_list._id},{$addToSet: {output_list : {$each : problem_obj.output_list}}},{updated : true});
            }
        }).then(result =>{
            if(result.nModified) throw new Error('outputlist update failure');
            if(result.n) throw new Error('No problem found');
        }).then(()=>{
            return model.problem.updateOne({problem_number : problem_number},{$addToSet : {category : {$each :problem_obj.category}}},{updated : true});
        }).then(result => {
            if(result.nModified) throw new Error('category update failure');
            if(result.n) throw new Error('No problem found');
            return model.problem.updateOne({problem_number : problem_number},{$addToSet : {name : {$each : problem_obj.name}}},{updated : true});
        }).then(result =>{
            if(result.nModified) throw new Error('name update failure');
            if(result.n) throw new Error('No problem found');
            res.status(200).json({message : "update complete"});
        })
    ).catch(err => {
        if(err.message === 'inputlist update failure'){
            res.status(400).json({message:'inputlist update failure'});
        }else if(err.message === 'outputlist update failure'){
            res.status(400).json({message:'outputlist update failure'});
        }else if(err.message === 'category update failure'){
            res.status(400).json({message:'categorylist update failure'});
        }else if(err.message === 'name update failure'){
            res.status(400).json({message:'name update failure'});
        }else if(err.message === 'No problem found'){
            res.status(404).json({message:'problem not found'});
        }else{
            res.status(500).json({message:'server-error'});
        }
    });
    
});


router.post('/deleteProblem/',function(req,res,next){
    const problemnumber = req.body.problem_number;
    model.problem.updateOne({problem_number : problemnumber},{deleted_yn : true},{updated :true})
    .then(result => {
        if(result.nModified === 0) throw new Error('delete failure');
        if(result.n === 0) throw new Error('not found');
        res.status(200).json({message:'prboelm is deleted'});
    }).catch( err =>{
        if(err.message === 'delete failure'){
            res.status(400).json({message:'delete failure'});
        }
        else if(err.message === 'not found'){
            res.status(404).json({message :'not found'});
        }
        else{
            res.status(500).json({message :'server-error'});
        }

    });
});

module.exports = router;
