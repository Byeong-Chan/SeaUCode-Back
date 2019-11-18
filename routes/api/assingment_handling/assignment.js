const express = require('express');
const router = express.Router();

const model = require('../../../models/model.js');
const auth = require('../../middleware/auth.js');
const mongoose = require('mongoose');

const bodyParser = require('body-parser');

router.use(bodyParser.urlencoded({
    extended: false
}));

//15-6 유저가 특정 학생이 푼 문제와 과제 정보를 요청하면(GET) 그 요청에 따라 푼 문제와 과제 정보를 모두 반환한다.
router.get('/',function(req,res,next){
    const user_id = mongoose.Types.ObjectId(req.decode_token._id); //받는값이 이게 맞는지 의문 =>아니면 넘어온 값을 통해 user를 통해 검색해서 작성해야하는지
    const response = {name : [] , problem : []}
    
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
            res.status(400).json('no assigment list exists')
        }
        else{
            res.status(500).json('server-error');
        }
    });

});