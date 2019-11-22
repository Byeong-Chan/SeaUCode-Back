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
    res.status(200).json({message: "success"});
});

module.exports = router;
