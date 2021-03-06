
/**
 * Module dependencies.
 */

var express = require('express')
var routes  = require('./routes');
var config  = require('./config');
var log     = require('./libs/log')(module);

var app = module.exports = express.createServer();

var io      = require('socket.io')(app);

// Configuration

app.configure(function(){
    app.set('views', __dirname + '/views');
    app.set('view options', {layout: 'index-layout'});
    app.set('view options', {layout: 'profile-layout'});
    app.set('view options', {layout: 'login-layout'});
    app.set('view engine', 'jade');
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.cookieParser());
    app.use(express.session({ secret: 'your secret here' }));
    app.use(app.router);
    app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
    app.use(express.errorHandler());
});

// Routes
var routes          = require('./routes')(app);
var logRrequest     = require('./libs/mysqlLogRequests');
var profileRequest  = require('./libs/mysqlProfileRequests')
var socketRequest   = require('./libs/mysqlSocketsRequests')


users = {};

io.sockets.on('connection', function (socket) {
    // console.log('login', socket);

    app.post('/profile', function (req, res) {
        profileRequest[req.body.action](req, res, function (body) {
            console.log('sending to browser');
            res.send(body);
        });
    });

    socket.on('addToStream', function(data){
        console.log('User : '+data.key+' with socket id : '+socket.id+' added to stream');
        console.log(data);
        if (!users[data.key]) {
            users[data.key] = {
                key : data.key,
                id  : socket.id
            }
        } else
            users[data.key].id = socket.id;
        console.log(users);
    });

    socket.on('like', function(like){
        console.log(like);
        socketRequest.getNotificationInfo({key: like.from}, function (liker) {
            liker.msg = like.action;
            if (users[like.to])
                io.to(users[like.to].id).emit('like', liker);
        });
    });

    socket.on('visit', function(visit){
        console.log(visit);
        socketRequest.getNotificationInfo({key: visit.from}, function (visiter) {
            visiter.msg =  'Visited your page.';
            if (users[visit.to])
                io.to(users[visit.to].id).emit('visit', visiter);
        });
    });

    socket.on('msg', function(data){
        console.log(data);
        socketRequest.getNotificationInfo({key: data.from}, function (r) {
            r.msg = data.action;
            r.messageInfo = data.msg;
            r.messageInfo.user_key = 'right-message';
            if (users[data.to])
                io.to(users[data.to].id).emit('msg', r);
        });
    });

    socket.on('disconnect', function() {
        console.log('logout', socket.id);
    });
});

app.post('/login', function (req, res) {
    logRrequest[req.body.action](req, function (body) {
        res.send(body);
    });
});

app.post('/reset', function (req, res) {
    logRrequest.reset(req, function (body) {
        res.send(JSON.stringify(body));
    });
});

app.listen(config.get('port'), function(){
    log.info("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});
