// dependencies
var express = require('express');
var path = require('path');
var WebSocket = require('ws');
var _ = require('underscore');
var config = require('./config');
var moment = require('moment');
var http = require('http');
var bodyParser = require('body-parser');
var multer = require('multer');


// server setup
var app = express();
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'))
app.use(express.static('node_modules'))

// from http://expressjs.com/api.html#req.body
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(multer()); // for parsing multipart/form-data

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.get('/', function(req, res) {
    res.render('index', {title: 'Decard'});
});
var server = app.listen(8000);
console.log('Server listening on port 8000');

// keep track of mapping from subscriptions to the queries for those subscriptions
var wsconns = {};

// socket.io setup
var io = require('socket.io')(server);

// socket.io triggers (server <-> clients/reactjs)
io.on('connection', function (socket) {
    console.log('New client connected!');

    // listen for a new subscription
    socket.on('new subscribe', function(msg) {

        // check if we already have a websocket for that connection.
        // If we already do, ignore.
        if (!_.has(wsconns, msg)) {
            console.log('new subscribe req', msg);

            // create a websocket for that subscription
            wsconns[msg] = new WebSocket(config.wsArchiverUrl+'/republish');

            // on opening the websocket, send the query message
            wsconns[msg].on('open', function open() {
                wsconns[msg].send(msg);
                console.log('opened', msg);
            });

            // when we receive a message from the server, emit the result
            // back to each of the clients
            wsconns[msg].on('message', function(data, flags) {
                io.emit(msg, JSON.parse(data));
            });

            wsconns[msg].on('close', function() {
                console.log('disconnected!');
            });
        }
    });
});
