/*
* express: Handles routing for API functionality
* path: Node module for handling path data and structuring
* logger: Logs calls that hit the API. Gives information on the endpoint, status, time to execute, etc.
* mongoose: Handles all things mongo. Connecting, and interacting with the Mongo DB.
* dotenv: Provides a location for all sensitive variable data. This is where passwords, port info, and any critical data lives.
* helmet: Cleans response headers. Restricts server information from being sent to client. (express, version, etc. can all be exploited if shared)
* */
const express = require('express');
const logger = require('morgan');
const mongoose = require('mongoose');
const helmet = require('helmet');


// require('./discord/bot');
require('dotenv').config();

const token = process.env.TOKEN;
const prefix = process.env.PREFIX;

/*
* savesRouter: All endpoints begining with /saves/ will be directed here. API for save data manipulation.
* auth: Provides connection to the auths collection.
* app: In simple terms, this is the backend server.
*
* */
const indexRouter = require('./routes/index');
const savesRouter = require('./routes/saves');
const usersRouter = require('./routes/users');
const tournamentsRouter = require('./routes/tournaments');
const seriesRouter = require('./routes/series');

const auth = mongoose.connection.collection('auths');
const app = express();


/*
* Authentication Middleware
* A request must be authenticated before it should be processed. A request is considered authentic if an authorization
* header is present, with a VALID api key.
* */
function authentication(req, res, next) {
    try {
        const authMethod = 'Basic';

        if (!req.headers.authorization) {
            const err = new Error('Not Authenticated: Missing Authorization header!');
            res.setHeader('authorization', authMethod);
            err.status = 401;
            return next(err)
        }
        let authheader = req.headers.authorization.split(" ");
        // If a result is in the database, the api key is valid, and the request can be processed.
        auth.countDocuments({'auth': authheader[1]}, function (err, count) {
            if (count > 0 && authheader[0] === authMethod) {
                next();
            } else {
                const err = new Error('The provided key is not valid!');
                res.setHeader('authorization', authMethod);
                err.status = 401;
                return next(err);
            }
        });
    } catch (e) {
        next(e);
    }

}


/*
* Creates a Mongo connection string.
* */
function getDBConnectionString() {
    return `mongodb+srv://${encodeURIComponent(process.env.DB_USER)}:${encodeURIComponent(process.env.DB_PASS)}@${encodeURIComponent(process.env.DB_LOCATION)}/${encodeURIComponent(process.env.DB_Name_Saves)}?retryWrites=true&w=majority`;
}

const dbURI = getDBConnectionString();


/*
* Establishes a connection with the Mongo Database
* */
mongoose.connect(dbURI, {useNewUrlParser: true, useUnifiedTopology: true})
    .then(result => app.listen(3001, (req, res, next) => console.log('Connected to port 3001')))
    /*.then(err => console.log(err))*/;


/*
* Specified middlewares that should be used when handling endpoints
*
* authentication: authenticates a request before processing
* helmet: Secures response headers.
* logger: logs the request being made
* express.json(): specifies body types
*  /saves: Binds /saves with the routes in savesRouter
* */
// app.use(authentication)
app.use(helmet());
app.use(logger('dev'));
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb', extended: true}));

app.use('/', indexRouter);
app.use('/saves', authentication, savesRouter);
app.use('/users', authentication, usersRouter);
app.use('/tournaments', authentication, tournamentsRouter);
app.use('/series', authentication, seriesRouter);
// console.log(Date(Date.parse(d)))


module.exports = app;