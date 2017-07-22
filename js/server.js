var http = require('http');
var server = new http.Server();

server.listen(8080, '127.0.0.1');

server.on('request', function (req, res) {
    res.end('Hello Friend');
});
