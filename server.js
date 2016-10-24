var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var cfenv = require('cfenv');

// set up mongodb
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var ObjectId = require('mongodb').ObjectID;
var url;
if(process.env.NODE_ENV === 'development'){
	url = 'mongodb://localhost:27017/test';
}
else if(process.env.NODE_ENV === 'production'){
	url = 'mongodb://abhinandan:abhinandan@aws-us-east-1-portal.15.dblayer.com:15615/abhinandan-first?ssl=true';
}

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies


var insert = function(db, callback, collection, document) {
	db.collection(collection)
	.insertOne(document, function(err, result) {
		assert.equal(err, null);
		console.log("Inserted new", document.constructor.name, "!");
		callback();
	});
};


	var login = function(db, callback, account) {
		var cursor = db.collection('accounts')
		.find(account);
		cursor.toArray(callback);
	};

app.use('/', express.static(__dirname + '/'));

app.get('/', function(req, res) {
  res.sendFile(__dirname+'/index.html');
});

app.post('/recipe-add', function(req, res) {
	console.log('got a post req!\n', req.body);

	MongoClient.connect(url, (err, db) => {
	  assert.equal(null, err);
	  insert(db, () => db.close(), 'recipes', req.body);
	});

	res.send();
});

app.post('/register', function(req, res) {
	console.log('got a post req for new account!\n', req.body);

	MongoClient.connect(url, function(err, db) {
	  assert.equal(null, err);
	  insert(db, function() { db.close(); }, 'accounts', req.body);
	});

	res.redirect('../');
});

app.post('/login', function(req, res) {

	MongoClient.connect(url, function(err, db) {
	  assert.equal(null, err);
	  login(db, function(err, documents) {
	  	db.close();
	  	if(err != null)
	  		console.log(err);
	  	if(documents.length === 0) {
	  		console.log('not successful');
	  		res.send({redirect: 'null'});
	  	}
	  	else if(documents.length === 1) {
	  		console.log('successful');
	  		res.send({redirect: '/'});
	  	}
	  	
	  }, req.body);
	});

	console.log('got a post req for login!\n', req.body);
	
});

if(process.env.NODE_ENV === 'production') {
	var appEnv = cfenv.getAppEnv();
	app.listen(appEnv.port, appEnv.bind, function() {
	  console.log("server starting on " + appEnv.url);
	});
}
else if(process.env.NODE_ENV === 'development') {
	app.listen(3000, function() {
	  console.log('Food Geek server listening on port 3000!');
	});

}
