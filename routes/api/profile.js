const express = require('express');
const router = express.Router();
const Profile = require('../../models/Profile');
const User = require('../../models/User');
const auth = require('../../middleware/auth');

router.get('/', (req , res) => {
    res.send("This is the Profile");
})

module.exports = router;