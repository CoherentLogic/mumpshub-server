var express = require('express');
var app = express();
var chalk = require('chalk');
var bodyParser = require('body-parser');
var morgan = require('morgan');
var mongoose = require('mongoose');
var passport = require('passport');
var config = require('./config/config'); // get db config file
var User = require('./app/models/user'); // get the mongoose model
var port = process.env.PORT || config.server.port;
var jwt = require('jwt-simple');
var pkg = require('./package.json');

console.log(chalk.bold.cyan("MUMPSHub API Server version " + pkg.version));
console.log(chalk.bold.blue(" Copyright (C) 2017 Coherent Logic Development\n\n"));

// get our request parameters
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// log to console
app.use(morgan('dev'));

// Use the passport package in our application
app.use(passport.initialize());

// demo Route (GET http://localhost:8080)
app.get('/', function(req, res) {
    res.send('Hello! The API is at http://localhost:' + port + '/api');
});

// connect to database
mongoose.connect(config.database.connectionString);

// pass passport for configuration
require('./config/passport')(passport);

// bundle our routes
var apiRoutes = express.Router();

// create a new user account (POST http://localhost:8080/api/signup)
apiRoutes.post('/register', function(req, res) {
    if (!req.body.name || !req.body.password) {
        res.json({success: false, msg: 'Please pass name and password.'});
    } 
    else {
        var newUser = new User({
            name: req.body.name,
            password: req.body.password
        });
        // save the user
        console.log(chalk.blue('%USER: create new user ' + newUser.name));
        try {
            newUser.save(function(err) {
                if (err) {
                    res.json({success: false, msg: 'Username already exists.'});   

                    console.error(chalk.bold.red("%USER: duplicate user " + newUser.name));                 
                }
                else {
                    res.json({success: true, msg: 'Successfully created new user.'});
                }
            });
        }
        catch (ex) {
            console.error(ex);
        }   
    }
});

// route to authenticate a user (POST http://localhost:8080/authenticate)
apiRoutes.post('/authenticate', function(req, res) {
    User.findOne({
        name: req.body.name
    }, function(err, user) {
        if (err) throw err;

        if (!user) {
            return res.status(403).send({success: false, msg: 'Authentication failed. User not found.'});
        } 
        else {
            // check if password matches
            user.comparePassword(req.body.password, function (err, isMatch) {
                if (isMatch && !err) {
                    // if user is found and password is right create a token
                    var token = jwt.encode(user, config.secret);
                    // return the information including token as JSON
                    res.json({success: true, token: 'JWT ' + token});
                } 
                else {
                    return res.status(403).send({success: false, msg: 'Authentication failed. Wrong password.'});
                }
            });
        }
    });
});

apiRoutes.get('/userinfo', passport.authenticate('jwt', { session: false}), function(req, res) {
    var token = getToken(req.headers);
    console.log('the token: ' + token);
    if (token) {
        var decoded = jwt.decode(token, config.secret);
        User.findOne({
            name: decoded.name
        }, function(err, user) {
            if (err) throw err;

            if (!user) {
                return res.status(403).send({success: false, msg: 'Authentication failed. User not found.'});
            } 
            else {
                res.json({success: true, msg: 'Welcome in the member area ' + user.name + '!'});
            }
        });
    } 
    else {
        return res.status(403).send({success: false, msg: 'No token provided.'});
    }
});

getToken = function (headers) {
    if (headers && headers.authorization) {
        var parted = headers.authorization.split(' ');
        if (parted.length === 2) {
            return parted[1];
        } 
        else {
            return null;
        }
    } 
    else {
        return null;
    }
};

// connect the api routes under /api/*
app.use('/api', apiRoutes);

// Start the server
app.listen(port);

app.on("error", function(err) {
    console.log("ERROR!");
});

console.log('Listening at port ' + port);
