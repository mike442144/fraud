var express = require('express')
var path = require('path')
//var logger = require('morgan')
//var cookieParser = reuqire('cookie-parser')
//var bodyParser = require('body-parser')


var app = express()

var hbs = require('hbs');
app.set('views',path.join(__dirname,'views'));
app.set('view engine','html');
app.engine('html',hbs.__express);
//app.use(bodyParser.json());
//app.use(bodyParser.urlencoded());
//app.use(cookieParser());
app.use(express.static(path.join(__dirname,'public')));

var routes = require('./routes/index');
app.use('/',routes);


app.set('port',process.env.PORT||3000);

var server = app.listen(app.get('port'),function(){
    console.log("Express server listening on port "+server.address().port);
});
