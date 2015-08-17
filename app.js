// dependencies
var express = require('express');
var path = require('path');
var WebSocket = require('ws');
var _ = require('underscore');
var config = require('./config');
var permalink = require('./permalink');
var moment = require('moment');
var exphbs  = require('express-handlebars');
var http = require('http');
var request = require('request');
var bodyParser = require('body-parser')

// server setup
var app = express();
//app.set('views', path.join(__dirname, 'views'));
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');
app.use(express.static('public'))
app.use(express.static('node_modules'))
app.use(bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));


app.get('/', function(req, res) {
    res.render('index', {layout: false});
});

app.get('/index', function(req, res) {
    res.render('index', {layout: false});
});

app.get('/dashpermalink/:permalinkid', function(req, res) {
    if (!req.params.permalinkid) {
        res.render('index', {layout: false});
    }
    console.log("get", req.params.permalinkid);
    permalink.getPermalink(req.params.permalinkid, function(result) {
        res.end(result);
    });
});

app.post('/dashpermalink', function(req, res) {
    var tosend = req.body.query;
    console.log(tosend);
    permalink.savePermalink(req.body.query,
        function(result, err) {
            console.log("returning from new dash permalink", result);
            if (err) {
                res.status(500).end(err.message)
            } else {
                res.end(result.toString());
            }
        }
    );
});


app.get('/config', function(req, res) {
    res.render('config', {layout: false});
});

app.post('/query', function(req, res) {

    if (req.body.query.length == 0) {
        res.json({});
    }
    var query = "select * where " + req.body.query
    request.post({ url: config.httpArchiverUrl+ '/api/query', body: query }, function(err, remoteResponse, remoteBody) {
        if (err) { return res.status(500).end('Error'); }
        if (remoteBody.length == 0) {
            res.json({});
        }
        try {
            res.json(JSON.parse(remoteBody));
        } catch(e) {
            res.status(500).end(remoteBody);
        }
    });
});

app.post('/dataquery', function(req, res) {
    if (req.body.query.length == 0) {
        res.json({});
    }
    var query = "select data before now as s where " + req.body.query;
    request.post({ url: config.httpArchiverUrl+ '/api/query', body: query }, function(err, remoteResponse, remoteBody) {
        if (err) { return res.status(500).end('Error'); }
        if (remoteBody.length == 0) {
            res.json({});
        }
        try {
            res.json(JSON.parse(remoteBody));
        } catch(e) {
            res.status(500).end(remoteBody);
        }
    });
});

app.post('/permalink', function(req, res) {
    var spec = {
        "window_type": "now",
        "window_width": parseInt(req.body.duration),
        "streams": [
            {"stream": req.body.uuid}
        ]
    }
    var tosend = {"permalink_data": JSON.stringify(spec)};
    console.log(tosend);
    console.log(config.plotterURL);
    request.post({url: config.plotterURL+"/s3ui_permalink", json: tosend}, function(err, remoteResponse, remoteBody) {
        if (err) { return res.status(500).end(err.message, remoteBody, remoteResponse); }
        res.end(config.plotterURL+"/?"+remoteBody);
    });
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
                var sendmsg;
                if (msg.length > 0) {
                    sendmsg = msg;
                }
                console.log("SUBSCRIBE TO", sendmsg);
                wsconns[msg].send(sendmsg);
                console.log('opened', sendmsg);
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
