const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const User = require('../../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const {check, validationResult} = require('express-validator');

router.get('/', auth, async (req , res) => {    
    
    //get the user from the req and return it in the response
    try{
    const user = await User.findById(req.user.id).select('-password');
    res.send(user);
    } catch(err){
        res.status(401).json({msg: "User not found"});
    } 
})


router.post('/', [check('email', 'please enter a valid email address').isEmail(),
                     check('password', 'entered password should be greater than the min value').isLength({min: 6})],
                     async (req , res) => {
                        const errors = validationResult(req);
                        if (!errors.isEmpty()) {
                          return res.status(400).json({ errors: errors.array() });
                        }
                        const {email, password} = req.body;
                        try{
                            const user = await User.findOne({email});
                            if(!user){
                                return res.status(401)
                                    .json({msg: "Invalid credentials"});
                            }
                            const isMatch = await bcrypt.compare(password , user.password);
                            if(isMatch){
                                const payload = { user: {id: user.id}}
                                jwt.sign(
                                    payload,
                                    config.get('jwtSecret'),
                                    {expiresIn: 36000},
                                    (err, token) => {
                                        if(err) throw err;
                                        res.send(token);
                                    });
                            } else{
                                return res.status(401).json({msg: "invalid credentials"});
                            }

                        } catch(err){
                            console.log(err);
                            return res.status(400).send('server error');
                        }
                    }
                     )

module.exports = router;