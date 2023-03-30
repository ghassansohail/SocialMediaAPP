const jwt = require('jsonwebtoken');
const config = require('config');

module.exports = function (req , res, next){
    const token = req.header('x-auth-token');

    if(!token){
        res.status(401).json({err: "No auth token found! Please login."});
    }
    try{
        const decoded =  jwt.verify(token, config.get('jwtSecret'));
        req.user = decoded.user;
        next();
    } catch{
        res.status(400).json({err: "The token entered is not valid"});
    }

}