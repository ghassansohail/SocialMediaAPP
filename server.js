const express = require('express');

const connectDB = require('./config/db');
const users = require('./routes/api/users');
const posts = require('./routes/api/posts');
const auth = require('./routes/api/auth');
const profile = require('./routes/api/profile');

const app = express();

// Connect to the Database
connectDB();

// Init MiddleWare
app.use(express.json({extended: false}));


// Adding the routes
app.use('/api/users', users );
app.use('/api/posts', posts );
app.use('/api/profile', profile );
app.use('/api/auth', auth );




const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => res.send("We're live") );

app.listen(PORT, () => console.log(`server started on port ${PORT}`))