process.env['NODE_ENV'] = process.env['NODE_ENV'] || 'dev';

//Web server
var express = require('express');

//Config details
var config = require('./../config.js');

//Instance of express
var app = module.exports = express();

var mongodb = require('mongodb'),
    MongoClient = mongodb.MongoClient;

global.db = MongoClient.db;
MongoClient.connect(config.param('mongo_uri'), function(err, d) {
    if(err) {
        console.log(err);
    } else {
        console.log('Connect to :: ' + d.databaseName);
        global.db = d;
    }
});

app.use(express.logger());

// parse request bodies (req.body)
app.use(express.bodyParser());

// support _method (PUT and DELETE in forms)
app.use(express.methodOverride());

// Activate Express router
app.use('/1.0', app.router);

setTimeout(function() {
    require('./router')(app);
}, 1000)


if (!module.parent) {
    var port = config.param('express_port');
    app.listen(port);
    console.log('Listening on port ' + port);
};

module.exports = app;
