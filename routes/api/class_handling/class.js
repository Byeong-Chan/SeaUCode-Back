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
                .where('classroom_id').equals(class_id).sort({send_time: -1}).limit(15).select({_id: 0, __v: 0, classroom_id: 0});
        }).then(result => {
            response.chatting = response.chatting.concat(result);
            for(let i = 0; i < response.chatting.length; i++) {
                response.chatting[i].send_time = response.chatting[i].send_time.getTime();
            }
            response.chatting.reverse();
            res.status(200).json(response);
        }).catch(err => {
            console.log(err);
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

router.get('/getNoticeList/:id',function(req,res,next){
    const user_id = mongoose.Types.ObjectId(req.decoded_token._id);
    const class_id = mongoose.Types.ObjectId(req.params.id);
    model.user.findOne().where("_id").equals(user_id).then(result => {
        if(result === null) throw new Error('user-not-found');
        return model.classroom.findOne()
            .where('_id').equals(class_id)
            .where('user_list').equals(result.nickname)
            .select('notice_list').select({_id: 0});
    }).then(result => {
        if(result === null) throw new Error('no notice list');
        res.status(200).json(result);
    }).catch(err =>{
        if(err.message === 'user-not-found') {
            res.status(403).json({message : 'user-not-found'});
        }
        else if(err.message === 'no notice list'){
            res.status(400).json({message :'no notice list'});
        }
        else{
            res.status(500).json({message : 'server-error'});
        }
    });
});

router.post('/postNotice', function(req, res, next) {
    const user_id = mongoose.Types.ObjectId(req.decoded_token._id);
    const class_id = mongoose.Types.ObjectId(req.body.id);
    model.user.findOne().where("_id").equals(user_id).then(result => {
        if(result === null) throw new Error('user-not-found');
        return model.classroom.findOne().where('_id').equals(class_id).where('classroom_owner').equals(result.nickname);
    }).then(result=>{
        if(result === null) throw new Error('teacher-auth-fail');
        return model.classroom.updateOne({"_id": class_id}, {$push: {notice_list: {content: req.body.content, send_date: req.body.send_date}}});
    }).then(result=>{
        res.status(200).json({message: 'success'});
    }).catch(err => {
        if(err.message === 'user-not-found') {
            res.status(403).json({message : 'user-not-found'});
        }
        else{
            res.status(500).json({message : 'server-error'});
        }
    });
});


//11-1
router.get('/getClassList',function(req,res,next){
    const user_id = mongoose.Types.ObjectId(req.decoded_token._id);
    const response = {name : [] };

    model.user.findOne()
    .where('_id').equals(user_id)
    .then(result => {
        return model.classroom.find()
        .where('user_list').in([result.nickname])
        .select('_id').select('name').select('user_list');
    }).then(result => {
        res.status(200).json({class_list : result});
    }).catch(err => {
        if(err.message === 'user do not match'){
            res.status(400).json({message : 'user do not match'});
        }
        else{
            res.status(500).json({message :'server-error'});
        }
    });

});



//13-1 해당 반의 반 id를 파라미터에 담아서 해당 반에 속한 학생들의 대한 정보를 요청(GET) 받으면 학생들의 대한 정보(이름, 닉네임)를 반환한다.
router.get('/getClassUserlist/:id',function(req,res,next){
    const user_id = mongoose.Types.ObjectId(req.decoded_token._id);
    const class_id = mongoose.Types.ObjectId(req.params.id);
    const owner_list = [];

    model.user.findOne().where('_id').equals(user_id)
    .then(result => {
        if(result === null) throw new Error('invalid-token');
        return model.classroom.findOne()
            .where('_id').equals(class_id)
            .where('classroom_owner').equals(result.nickname);
    }).then(result => {
        if (result === null) throw new Error('no classroom exist');
        for(let i = 0; i < result.classroom_owner.length; i++) {
            owner_list.push(result.classroom_owner[i]);
        }
        return model.user.find()
        .where('nickname').in(result.user_list)
        .select({'_id':0}).select('name').select('nickname');
    }).then(result =>{
        res.status(200).json(result.filter(e => owner_list.find(target => target === e.nickname) === undefined));
    }).catch( err => {
        console.log(err);
        if(err.message === 'no classroom exist'){
            res.status(400).json({message : 'class do not exist'});
        }
        else{
            res.status(500).json({message : 'server-error'});
        }
    });
}); 

//14-2학생 추가 요청(POST)이 들어오면 해당 반에 해당 학생을 추가하는 API를 만든다.(반 id하고 학생 닉네임)
router.post('/addStudentToClass',function(req, res, next) {
    const class_id = mongoose.Types.ObjectId(req.body._id);
    const nickname = req.body.nickname;

    model.user.findOne({nickname: nickname}).then(result => {
        if(result === null) throw new Error('add-student-not-found');
        return model.user.findOne({_id: mongoose.Types.ObjectId(req.decoded_token._id)});
    }).then(result => {
        if(result === null) throw new Error('user-not-found');
        return model.classroom.updateOne({
                _id : class_id,
                classroom_owner: {$eq : result.nickname}
            },
            { $addToSet :{user_list :nickname} },
            { updated :true }
        );
    }).then(result => {
        if(result.nModified === 0) throw new Error ('update failure :classroom does not match');
        if(result.n === 0) throw new Error ('not found');
        res.status(200).json({message : "student is added"});
    }).catch(err =>{
        if(err.message === 'add-student-not-found') {
            res.status(404).json({message: 'add-student-not-found'});
        }
        else if(err.message === 'user-not-found') {
            res.status(403).json({message: 'user-not-found'});
        }
        else if(err.message === 'class-auth-fail') {
            res.status(403).json({message: 'class-auth-fail'});
        }
        else if(err.message === 'update failure :classroom does not match'){
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
router.post('/deleteStudentInClass/',function(req,res,next){
    const class_id = mongoose.Types.ObjectId(req.body._id);
    const nickname = req.body.nickname;

    model.user.findOne({_id: mongoose.Types.ObjectId(req.decoded_token._id)}).then(result => {
        if (result === null) throw new Error('user-not-found');
        return model.classroom.updateOne({
                _id: class_id,
                classroom_owner: {$ne: nickname, $eq: result.nickname}
            },
            {$pull: {user_list: nickname}},
            {updated: true}
        );
    }).then(result => {
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

//27-2 과제 목록을 요청(GET)받으면 해당 학생의 모든 과제목록을 반환한다.
router.get('/getAssignmentList',function(req,res,next){
    const user_id = mongoose.Types.ObjectId(req.decoded_token._id);

    model.assignment.find()
    .where('user_id').equals(user_id)
    .select({"_id": 0}).select('name').select('problem_list').select('start_date').select('end_date')
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
    .where('user_list').in(user_id)
    .then(result => {
        return model.assignment.find()
        .where('classroom_name').equals(result.name)
        .where('user_id').equals(user_id)
        .select({"_id": 0}).select('name').select('problem_list').select('start_date').select('end_date');
    }).then(result =>{
        res.status(200).json(result);
    }).catch(err => {
        res.status(500).json({message : 'server-error'});
    });

});

router.get('/getChattingList/:page/:id', (req, res, next) => {
    
    const class_id = mongoose.Types.ObjectId(req.params.id);
    model.chatting.find().where('classroom_id').equals(class_id)
        .sort({send_time: 'desc'}).skip(req.params.page * 15 - 15).limit(15)
        .select({'_id': 0}).select('send_time').select('message').select('owner')
        .then(result => {
            const ChattingValue = [];
            for(let i = 0; i < result.length; i++) {
                ChattingValue.push({
                    send_time : result[i].send_time.getTime(),
                    message : result[i].message,
                    owner : result[i].owner
                });
            }
            ChattingValue.reverse();
            res.status(200).json({chatting_list: ChattingValue});
        }).catch(err => {
            console.log(err);
            res.status(500).json({message: "server-error"});
    });
});

router.post('/saveChatting',(req,res,next) => {
    const user_id = mongoose.Types.ObjectId(req.decoded_token._id);
    const class_id = req.body.id;
    const now  = new Date();
    let user_nickname = '';

    model.user.findOne()
    .where('_id').equals(user_id)
    .then(result => {
        user_nickname = result.nickname;
        const save_chatting = new model.chatting({
            send_time : now,
            message : req.body.message,
            owner : user_nickname,
            classroom_id : class_id
        });
        return save_chatting.save();
    }).then(result => {
        req.app.get('server-socket').emit(req.body.id, {
            send_time : now.getTime(),
            message : req.body.message,
            owner : user_nickname,
            classroom_id : class_id});
        res.status(200).json({message : "chatting is saved"});
    }).catch(err => {
        res.status(500).json({message : 'server-error'});
    });
});


module.exports = router;
