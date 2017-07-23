var nconf = require('nconf');
var path = require('path');
var config = require('./config');

nconf.argv()
	.env()
	.file( {file: path.join(__dirname, 'config.json') });

module.exports = nconf;
