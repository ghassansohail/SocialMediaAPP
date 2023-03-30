const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({

    name:{
        type: String,
        required: true,
        max: 255
    },
    email:{
        type: String,
        required: true,
        unique: true,
        max: 255,
    },
    password:{
        type: String,
        required: true,
        max: 255,
    },
    avatar:{
        type: String
    },
    date:{
        type: Date, 
        default: Date.now()
    }
});

module.exports = User = mongoose.model('user', UserSchema)
