const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
const model = require('../../models/model.js');

const bodyParser = require('body-parser');

const auth = require('../middleware/auth.js');

router.use(bodyParser.urlencoded({
    extended: false
}));

router.use(auth);

router.get('/', function(req, res, next) {
    const user_id = mongoose.Types.ObjectId(req.decoded_token._id);
    model.user.findOne()
        .where('_id').equals(user_id)
        .select({'_id' : 0})
        .select('email')
        .select('name')
        .select('nickname')
        .select('role')
        .then(result => {
            res.status(200).json(result);
        }).catch(err => {
            if(err) {
                res.status(500).json({message: "server error"});
            }
    });
});

module.exports = router;