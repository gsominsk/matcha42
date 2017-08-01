
/**
 * Module dependencies.
 */

var express = require('express')
var routes = require('./routes');
var config = require('./config');
var log = require('./libs/log')(module);

var app = module.exports = express.createServer();

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

app.post('/profile', function (req, res) {
    profileRequest[req.body.action](req, res, function (body) {
        console.log('sending to browser');
        res.send(body);
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
