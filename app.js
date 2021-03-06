var express = require('express')
var path = require('path')
require('./lib').extendResponse(express)
//var logger = require('morgan')
//var cookieParser = reuqire('cookie-parser')
var bodyParser = require('body-parser')

var app = express()

//var hbs = require('hbs');
//app.set('views',path.join(__dirname,'views'));
//app.set('view engine','html');
//app.engine('html',hbs.__express);
//app.engine('html',require("ejs").renderFile);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
//app.use(cookieParser());
app.use(express.static(__dirname+'/public'));
app.use('/sm', express.static(__dirname + '/public/smartadmin'));
app.use('/angle',express.static(__dirname+'/public/angle'));
app.use('/bda',express.static(__dirname+'/public/bda'));
app.use('/upfile',express.static(__dirname+'/public/upload'));

var routes = require('./routes/index');
app.use('/',routes);

module.exports = app;
