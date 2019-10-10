const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {

    // read the token from header or url
    const token = req.headers['x-access-token'] || req.query.token;

    // token does not exist
    if(!token) {
        return res.status(403).json({
            success: false,
            message: 'not logged in'
        });
    }

    // create a promise that decodes the token
    const p = new Promise(
        (resolve, reject) => {
            jwt.verify(token, req.app.get('jwt-secret'), (err, decoded) => {
                if(err) reject(err);
                else resolve(decoded);
            });
        }
    );

    // if token is valid, it will respond with its info
    const respond = (token) => {
        res.json({
            success: true,
            info: token
        });
    };

    // if it has failed to verify, it will return an error message
    const onError = (error) => {
        res.status(403).json({
            message: "auth-fail"
        });
    };

    // process the promise
    p.then(respond => {
        req.decoded_token = respond;
        next();
    }).catch(onError);
};

module.exports = authMiddleware;