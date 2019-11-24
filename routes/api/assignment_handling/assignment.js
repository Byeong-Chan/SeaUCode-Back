const express = require('express');
const router = express.Router();

const model = require('../../../models/model.js');
const auth = require('../../middleware/auth.js');
const mongoose = require('mongoose');

const bodyParser = require('body-parser');

router.use(bodyParser.urlencoded({
    extended: false
}));
router.use(auth);
//15-6 
router.get('/getAssignmentProblem',function(req,res,next){
    const user_id = mongoose.Types.ObjectId(req.decoded_token._id); 
    const response = {name : '' ,  problem : []}
    
    model.assignment.find()
    .where('user_id').equals(user_id)
    .then(result => {
        if(result === null) throw new error('no assignment has been sovled');
        response.name = result.name;
        response.problem = result.problem_list;
    }).then(() => {
        res.status(200).json(response);
    }).catch(err => {
        if(err.message === 'no assignment has been solved'){
            res.status(400).json({message:'no assigment list exists'});
        }
        else{
            res.status(500).json({message:'server-error'});
        }
    });
});

//27-2 과제 목록을 요청(GET)받으면 해당 학생의 모든 과제목록을 반환한다.
router.get('/getAllAssignment',function(req,res,next){
    const user_id = mongoose.Types.ObjectId(req.decoded_token._id);

    model.assignment.find()
    .where('user_id').equals(user_id)
    .select('name').select('start_date').select('end_date')
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
        .where('user_id').equals(user_id)
        .select('name').select('start_date').select('end_date');
    }).then(result =>{
        res.status(200).json(result);
    }).catch(err => {
        res.status(500).json({message : 'server-error'});
    });

});

//29-2
router.get('/getAssignmentProblemList/:id',function(req,res,next) {


    model.assignment.findOne()
    .where('_id').equals(req.params.id)
    .then(result => {
        if(result === null) throw new Error ('no assignment exist');
        res.status(200).json(result.problem_list);
    }).catch(err => {
        if(err.message === 'no assignment exist'){
            res.status(400).json({message : "no assigment exist" });
        }else{
            res.status(500).json({message : "server-error"});
        }
    });
});

module.exports = router;