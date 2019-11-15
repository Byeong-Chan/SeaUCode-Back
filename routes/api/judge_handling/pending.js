const express = require('express');
const router = express.Router();

const model = require('../../../models/model.js');

const bodyParser = require('body-parser');

const auth = require('../../middleware/auth.js');

router.use(bodyParser.urlencoded({
    extended: false
}));

router.use(auth);

router.post('/submitCode', (req, res, next) => {
    const save_judge_result = model.judge({
        state: 1,
        code: req.body.code,
        language: req.body.language,
        user_id: req.decoded_token._id,
        problem_number: req.body.problem_number,
        ErrorMessage: '',
        is_solution_provide : false
    });

    save_judge_result.save()
        .then(result => {
            // TODO: 여기서 Judge Queue 만들것 지금 당장은 서버가 1개만 있다고 가정 후 코딩
            const save_judge_queue = model.judgeQueue({
                server_number: 1,
                pending_number: result.pending_number
            });
            return save_judge_queue.save();
        }).then(result => {
            console.log(result);
            res.status(200).json({message: 'submit-success'});
        }).catch(err => {
            console.log(err);
            res.status(500).json('server-error');
    });
});

module.exports = router;
