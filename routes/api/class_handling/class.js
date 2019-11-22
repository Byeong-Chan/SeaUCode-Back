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


router.post('/createClass', function(req, res, next) {
    const user_id = mongoose.Types.ObjectId(req.decoded_token._id);

    model.user.findOne()
        .where('_id').equals(user_id)
        .then(result => {
            if(result === null) throw new Error('invalid-token');
            if(result.role !== 1) throw new Error('role-auth-fail');

            const save_classroom = model.classroom({
                name : req.body.name,
                classroom_master : result.nickname,
                user_list : [result.nickname],
                classroom_owner : [result.nickname],
                notice_list : [],
                request_student_list: []
            });

            return save_classroom.save();
        }).then(result => {
            res.status(200).json({'class_id': result._id.toString()});
        }).catch(err => {
            if(err.message === 'invalid-token') {
                res.status(400).json({message:'invalid-token'});
            }
            else if(err.message === 'role-auth-fail') {
                res.status(403).json({message: 'role-auth-fail'});
            }
            else {
                res.status(500).json({message: 'server-error'});
            }
    });
});

router.get('/getClassInfo/:id', function(req, res, next) {
    const user_id = mongoose.Types.ObjectId(req.decoded_token._id);
    const class_id = mongoose.Types.ObjectId(req.params.id);

    const response = { name: '', notice : [], chatting: [] };

    let user_nickname = '';

    model.user.findOne()
        .where('_id').equals(user_id)
        .then(result => {
            if(result === null) throw new Error('not-exist-user');
            user_nickname = result.nickname;
            return model.classroom.findOne()
                .where('_id').equals(class_id)
        }).then(result => {
            if(!result)
                throw new Error('not-exist-class');
            if(result.user_list.find(function(element) { return element == user_nickname; }) === undefined)
                throw new Error('class-auth-fail');
            response.name = result.name;
            response.notice = response.notice.concat(result.notice_list.slice(-1));
            return model.chatting.find()
                .where('classroom_id').equals(class_id);
        }).then(result => {
            response.chatting = response.chatting.concat(result);
            res.status(200).json(response);
        }).catch(err => {
            if(err.message === 'not-exist-class') {
                res.status(404).json({message: 'not-exist-class'});
            }
            else if(err.message === 'class-auth-fail') {
                res.status(403).json({message: 'class-auth-fail'});
            }
            else if(err.message === 'not-exist-user') {
                res.status(403).json({message: 'not-exist-user'});
            }
            else {
                res.status(500).json({message: 'server-error'});
            }
    });
});

//9-2 반 id와 함께 공지목록과 그 내용 요청(GET) 받으면 반환한다.  (여기서 반 id를 parameter로 받는게 맞는지 확인 아니면 user를 통해 반 id를 찾아서 접근해야하는지
router.get('/getNoticeList/:id',function(req,res,next){

    const class_id = mongoose.Types.ObjectId(req.params.id);
    
    
    model.classroom.findOne()
    .where('_id').equals(class_id)
    .select('notice_list')
    .then(result => {
        if(result === null) throw new Error('no notice list');
        res.status(200).json(result);
    }).catch(err =>{
        if(err.message === 'no notice list'){
            res.status(400).json({message :'no notice list'});
        }
        else{
            res.status(500).json({message : 'server-error'});
        }
    });
});


//11-1
router.get('/getClassList',function(req,res,next){
    const user_id = mongoose.Types.ObjectId(req.decoded_token._id);

    model.user.find()
    .where('_id').equals(user_id)
    .then(result => {
        if(result === null) throw new error ('user do not match');
        return result.classroom_list;
    }).then(result => {
        res.status(200).json(result);
    }).catch(err => {
        if(err.message === 'user do not match'){
            res.status(400).json({message : 'user do not match'});
        }
        else{
            res.status(500).json('server-error');
        }
    });

});



//13-1 해당 반의 반 id를 파라미터에 담아서 해당 반에 속한 학생들의 대한 정보를 요청(GET) 받으면 학생들의 대한 정보(이름, 닉네임)를 반환한다.
router.get('/getClassUserlist/:id',function(req,res,next){
    const user_id = mongoose.Types.ObjectId(req.decoded_token._id);
    const class_id = mongoose.Types.ObjectId(req.params.id);
    const response = {name : [], nickname : []};
    
    
    //질의 순서 반에서 userlist를 가져와서 user_list에 있는 user_id와 user의 _id 비교해서 이름과 닉네임 반환
    model.classroom.findOne()
    .where('_id').equals(class_id)
    .then(result => {
        if (result === null) throw new Error('no classroom exist');
        return model.user.find({nickname : $in(result.user_list)});
    }).then(result =>{
        response.name = response.name.concat(result.name.slice(-1));
        response.nickname = response.nickname.concat(result.nickname.slice(-1));    
    }).then(result => {
        res.status(200).json(response);
    }).catch( err => {
        if(err.message === 'no classroom exist'){
            res.status(400).json({message : 'class do not exist'});
        }
        else{
            res.status(500).json({message : 'server-error'});
        }
    });
}); 

//14-2학생 추가 요청(POST)이 들어오면 해당 반에 해당 학생을 추가하는 API를 만든다.(반 id하고 학생 닉네임)
router.post('/addStudentToClass/:id/:nickname',function(req,res,next){
    const class_id = mongoose.Types.ObjectId(req.params.id);
    const nickname = req.params.nickname;

    model.classroom.updateOne({_id : class_id},{$push :{user_list :nickname}},{updated :true})
    .then(result => {
        if(result.nModified === 0) throw new Error ('update failure :classroom does not match');
        if(result.n===0) throw new Error ('not found');
        res.status(200).json({message : "student is added"});
    }).catch(err =>{
        if(err.message === 'update failure :classroom does not match'){
            res.status(400).json({message :'update failure :classroom does not match'});
        }else if(err.message === 'not found'){
            res.status(404).json({message : 'not found'});
        }
        else{
            res.status(500).json({message:'server-error'});
        }
    });
});

//16-2학생 삭제 요청(POST)이 들어오면 해당 반에 해당 학생을 삭제를 요청하는 API를 만든다.
router.post('/deleteStudentInClass/:id/:nickname',function(req,res,next){
    const class_id = mongoose.Types.ObjectId(req.params.id);
    const nickname = req.params.nickname;

    model.classroom.updateOne({_id : class_id},{$pull :{user_list : nickname}},{updated : true})
    .then(result => {
        if(result.nModified === 0) throw new Error ('update failure :classroom does not match');
        if(result.n===0) throw new Error ('not found');
        res.status(200).json({message : "student is deleted"});
    }).catch(err =>{
        if(err.message === 'update failure :classroom does not match'){
            res.status(400).json({message :'update failure :classroom does not match'});
        }else if(err.message === 'not found'){
            res.status(404).json({message : 'not found'});
        }
        else{
            res.status(500).json({message:'server-error'});
        }
    });
});

module.exports = router;
