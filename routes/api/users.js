const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const User = require('../../models/User')
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config')


router.post('/', [ check('name', 'name is requires' ).not().isEmpty(),
        check('email', 'should be a valid email').isEmail(),
        check('password', 'password should be atleast 6 characters long').isLength({ min: 6 })
    ], async (req , res) => { 
    
        const errors = validationResult(req);
        if (!errors.isEmpty()){
            return res.status(400).json({errors: errors.array()});
        }
        try{
        let {name, email, password} = req.body;
        let user = await User.findOne({email});
        
        if(user){
            return res.status(500).json({errors: [{msg: 'User already exists'} ]});
        }

        avatar = gravatar.url(email, {
            s: '200',
            r: 'pg',
            d: 'mm' 
        })

        const salt = await bcrypt.genSalt(10);
        password = await bcrypt.hash(password, salt);
        user = new User({
            name,
            email,
            password,
            avatar
        })
        await user.save();
        
        //JWToken
        payload = { user: { id: user.id } }

        jwt.sign(
            payload,
            config.get('jwtSecret'),
            {expiresIn: 36000000},
            (err, token)=>{
                if(err) throw err;
                res.json({token});
            }             
        );
        
    } catch(err){
        console.log(err);
        res.status(400).send('server error');
        }
    }
  
   )

module.exports = router;