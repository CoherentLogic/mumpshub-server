console.log("MUMPSHub Server v0.1.0");
console.log(" Copyright (C) 2017 Coherent Logic Development LLC\n\n");

var bodyParser = require('body-parser');
var http = require('http');
var express = require('express');
var logger = require('morgan');

var config = require('../config.js');
var routes = require('./routes');

var app = express();

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.set('port', config.port);

app.use('/', routes);

app.use(function(req, res, next) {
    var err = new Error("Not found");
    err.status = 404;
    next(err);
});

app.use(function(err, req, res, next) {

    res.status(err.status || 500);
    res.send("Error " + err.status);

});

var server = http.createServer(app);

server.listen(config.port);

server.on('listening', function() {
    console.log("Listening on port " + server.address().port);
});

server.on('error', function(err) {
    console.error("Error " + err.code);
});