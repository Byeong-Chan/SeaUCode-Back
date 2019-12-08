const mongoose = require('mongoose');
const autoIncrement = require('mongoose-auto-increment');

autoIncrement.initialize(mongoose.connection);

const userSchema = new mongoose.Schema({
    role : {type : Number, enum : ['Teacher', 'Student','SuperUser']},
    email : {type : String , required : true, match : /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, lowercae: true, unique: true},
    // email을 받을 때 이미 존재하는 여부 따지고 특정형식을 따르며 소문자로 받아야함
    password : String,
    name : String,
    email_auth : Boolean,
    email_token : String,
    solved_problems : [Number],
    salt: String,
    nickname : { type: String, unique: true },
    codeforces_id: String,
    boj_id: String,
    spoj_id: String
});

const classroomSchema = new mongoose.Schema({
    name : String,
    classroom_master : String,
    user_list : [String],
    classroom_owner : [String],
    notice_list : [
        {
            content : String,
            send_date : Date
        }
    ],
    request_student_list: [String]
});

const problemSchema = new mongoose.Schema({
    name: String,
    problem_description : String,
    sample_input : String,
    sample_output : String,
    input_description : String,
    output_description : String,
    solution : String,  //File 객체가 실제로 없는것으로 확인했습니다. 제 예전 프로젝트도 이 문제 때문에 우회했었네요.
    difficulty : Number,
    Category : [String],
    problem_number: {
        type: Number,
        unique: true
    },
    input_list: [{_id: Number, txt: String}],
    output_list: [{_id: Number, txt: String}],
    spj: Boolean,
    spj_code: String,
    delete_yn : Boolean,
    memory_limit: Number, // Please "Byte"
    time_limit: Number // Please "ms"
});

problemSchema.plugin(autoIncrement.plugin, {
    model: 'Problem',
    field: 'problem_number',
    startAt: 10000
});

const contestSchema = new mongoose.Schema({
    problems : [String],
    start_time : Date,
    end_time : Date
});

const chattingSchema = new mongoose.Schema({
    send_time : Date, //https://codeday.me/ko/qa/20190319/100309.html => 반환할때 node js에서 반환 값 포맷하는 법을 알려주는 url
    message : String,
    owner : String,
    classroom_id : String
});

const judgeResultSchema = new mongoose.Schema({
    state: {type: Number, enum : ['Pending', 'AC', 'WA', 'TLE', 'MLE', 'RE', 'PE', 'CE', 'JF']},
    pending_number: {
        type: Number,
        unique: true
    },
    pending_date: Date,
    time_usage: Number,
    memory_usage: Number,
    code: String,
    language: String,
    user_id: String,
    user_nickname: String,
    problem_number: Number,
    ErrorMessage: String,
    is_solution_provide : Boolean
});

judgeResultSchema.plugin(autoIncrement.plugin, {
    model: 'Judge',
    field: 'pending_number',
    startAt: 100000
});

const judgeQueueSchema = new mongoose.Schema({
    server_number: Number,
    pending_number: Number
});

const judgeServerSchema = new mongoose.Schema({
    server_number: Number,
    server_ip: String,
    state : {type : Number, enum : ['OK', 'Error']}
});

const codetimeSchema = new mongoose.Schema({
    user_id : String,
    problem_number : Number,
    pending_number : Number,
    input_list: [{_id: Number, txt: String}],
    codeTime : [{code : String, admit_time : Number}],
    comment: [{content: String, admit_time: Number, comment_number: Number}]
});

const assignmentSchema = new mongoose.Schema({
    user_nickname : String,
    name : String,
    problem_list : [String],
    start_date : Date,
    end_date : Date,
    classroom_name : String,
    teacher_nickname : String,
    class_id: String
});

const userFeedbackSchema = new mongoose.Schema({
    feedback_number : Number,
    problem_number : Number,
    content : String
});

const outProblemSchema = new mongoose.Schema({
    name: String,
    Category: [],
    problem_number: {type:String, unique: true},
    problem_solver: Number,
    problem_rating: Number
});

const outJudgeResultSchema = new mongoose.Schema({
    pending_link: { type: String, unique: true},
    oj: String,
    oj_id: String,
    problem_number: String
});

//참고로 몽구스는 model의 첫 번째 인자로 컬렉션 이름을 만듭니다. User이면 소문자화 후 복수형으로 바꿔서 users 컬렉션이 됩니다.
module.exports = {
    user: mongoose.model('User', userSchema),
    classroom: module.exports.classroom = mongoose.model('Classroom', classroomSchema),
    problem: module.exports.problem = mongoose.model('Problem', problemSchema),
    contest : module.exports.contest = mongoose.model('Contest',contestSchema),
    chatting: module.exports.chatting = mongoose.model('Chatting', chattingSchema),
    judge: module.exports.judge = mongoose.model('Judge', judgeResultSchema),
    judgeQueue: module.exports.judgeQueue = mongoose.model('JudgeQueue', judgeQueueSchema),
    judgeServer: module.exports.judgeServer = mongoose.model('JudgeServer', judgeServerSchema),
    codeTime : module.exports.codeTime = mongoose.model('CodeTime',codetimeSchema),
    assignment : module.exports.assignment = mongoose.model('Assignment',assignmentSchema),
    userFeedback : module.exports.userFeedback = mongoose.model('UserFeedback',userFeedbackSchema),
    outProblem: module.exports.outProblem = mongoose.model('OutProblem', outProblemSchema),
    outJudgeResult: module.exports.outJudgeResult = mongoose.model('OutJudgeResult', outJudgeResultSchema)
};