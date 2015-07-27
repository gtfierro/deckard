// dependencies
var express = require('express');
var path = require('path');
var WebSocket = require('ws');
var _ = require('underscore');
var config = require('./config');
var moment = require('moment');
var http = require('http');

// server setup
var app = express();
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'))
app.use(express.static('node_modules'))

app.get('/', function(req, res) {
    res.render('index', {title: 'Deckard'});
});

var server = app.listen(8000);
console.log('Server listening on port 8000');

// keep track of mapping from subscriptions to the queries for those subscriptions
var wsconns = {};

// socket.io setup
var io = require('socket.io')(server);

console.log(config);

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
