const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mongoose = require('mongoose');
require('dotenv').config();

const savesRouter = require('./routes/saves');
const authRouter = require('./routes/auth');

const app = express();


function authentication(req, res, next) {
    const authMethod = 'Basic';
    const authheader = req.headers.authorization.split(" ");

    if (!authheader) {
        const err = new Error('Not Authenticated!');
        res.setHeader('authorization', authMethod);
        err.status = 401;
        return next(err)
    }


    Auth.countDocuments({'auth': authheader[1]}, function (err, count) {
        if (count > 0 && authheader[0] === authMethod) {
            next();
        }else{
            const err = new Error('Not Authenticated!');
            res.setHeader('authorization', authMethod);
            err.status = 401;
            return next(err);
        }
    });next



}
app.use(authentication)

/*
* Creates a Mongo connection string
* */
function getDBConnectionString(){
    return `mongodb+srv://${encodeURIComponent(process.env.DB_USER)}:${encodeURIComponent(process.env.DB_PASS)}@${encodeURIComponent(process.env.DB_LOCATION)}/${encodeURIComponent(process.env.DB_Name_Saves)}?retryWrites=true&w=majority`;
}

const dbURI = getDBConnectionString();

mongoose.connect(dbURI, {useNewUrlParser: true, useUnifiedTopology: true})
    .then(result => app.listen(3001, (req, res) => console.log('Connected to port 3001')))
    .then(err => console.log(err));




app.use(logger('dev'));
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb', extended: true}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/saves', savesRouter);
app.use('/auth', authRouter);

module.exports = app;