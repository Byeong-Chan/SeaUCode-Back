  
const express = require('express');
const router = express.Router();

const model = require('../../../models/model.js');
const auth = require('../../middleware/auth.js');
const mongoose = require('mongoose');
const crypto = require('crypto');

const bodyParser = require('body-parser');

router.use(bodyParser.urlencoded({
    extended: false
}));
router.use(auth);



router.post('/userRevise',function(req,res,next){
    
    const user_id = mongoose.Types.ObjectId(req.decoded_token._id);
    const update_info = req.body;

    const user_salt = crypto.randomBytes(128).toString('hex');
    const hashed_password = crypto.createHmac('sha512', user_salt).update(update_info.password).digest('hex');

    update_info.salt = user_salt;
    update_info.password = hashed_password;

    model.user.updateOne({_id:user_id},{ $set: update_info },{updated :true})
        .then(result =>{
            if(result.nModified === 0) throw new Error('update failure');
            if(result.n === 0) throw new Error('not found');
            res.status(200).json({message: 'name and password is changed'});
        }).catch(err =>{

            if(err.message === 'update failure'){
                res.status(400),json({message :'update failure'});
            }else if(err.message === 'not found'){
                res.status(404).json({message : 'not found'});
            }
            else{
                res.status(500).json({message:'server-error'});
            }
    });
});


router.delete('/userDelete',function(req,res,next){
    const user_id = mongoose.Types.ObjectId(req.decoded_token._id);

    model.user.deleteOne({_id:user_id})
    .then(result =>{
        if(result.nMatched === 0) throw new Error('user do not exist');
        res.status(200).json({message :'user is deleted'});
    }).catch(err =>{
        if(err.message === 'user do not exist'){
            res.status(400).json({message :'user do not exist'});
        }
        else{
        res.status(500).json({message: 'server-error'});
        }
    });
});


module.exports = router;