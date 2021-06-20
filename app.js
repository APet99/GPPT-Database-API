const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mongoose = require('mongoose');
require('dotenv').config();

const savesRouter = require('./routes/saves');


const app = express();

function getDBConnectionString(){
    return `mongodb+srv://${encodeURIComponent(process.env.DB_USER)}:${encodeURIComponent(process.env.DB_PASS)}@cluster0.cfgby.mongodb.net/${encodeURIComponent(process.env.DB_Name_Saves)}?retryWrites=true&w=majority`;
}

const dbURI = getDBConnectionString();
console.log(dbURI);

mongoose.connect(dbURI, {useNewUrlParser: true, useUnifiedTopology: true})
    .then(result => app.listen(3001, (req, res) => console.log('Connected to port 3001')))
    .then(err => console.log(err));



app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/saves', savesRouter);

module.exports = app;