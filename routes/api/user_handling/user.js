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



router.post('/userRevise',function(req,res,next){
    
    const user_id = mongoose.Types.ObjectId(req.decoded_token._id);
    model.user.update({_id:user_id},{ $set: req.body },{updated :true})
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



module.exports = router;