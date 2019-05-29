// var url = require("url");
var http = require('http');
var express = require('express');
var app = express();
var server = http.createServer(app);
var io = require('socket.io').listen(server);
//var requestHandlers = require("./requestHandlers");
var bodyParser = require('body-parser');
var youtubedl = require('@microlink/youtube-dl');
const {Howl, Howler} = require('howler');

//testing...
var url = "https://www.youtube.com/watch?v=6ONRf7h3Mdk";

function start() {

	session = require("express-session")({
		secret: "secret!",
		resave: true,
		saveUninitialized: true
	});
	sharedsession = require("express-socket.io-session");
	app.use(session)
	io.use(sharedsession(session));
	//app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
	  extended: true
	}));
	//var json = require('express-json');
	app.use(bodyParser.json());

	app.use('/static', express.static('node_modules'));
	app.use(express.static(__dirname + '/public/html'));
	app.use(express.static(__dirname + '/public/js'));
	app.use(express.static(__dirname + '/public/css'));

	app.use('/jquery', express.static(__dirname + '/node_modules/jquery/dist/'));


	app.get('/', function (req, res) {
		res.sendFile(__dirname + '/html/index.html')
	});

	
	app.get('/sendInfo',function(req,res){
		console.log(JSON.stringify(req.query));
		sentInfo.push(req.query);
		res.send({})
	})

	let sentInfo = [];
	app.get('/getInfo',function(req, res){
		//testData.push({"dataNum":testData.length})
		res.send({"data":sentInfo});
	})

	app.get('/play', function(req, res) {
		youtubedl.exec(url, ['-x', '--audio-format', 'aac'], {}, function exec (
			err,
			output
		  ) {
			'use strict'
			if (err) {
			  throw err
			}
			console.log(output.join('\n'))
		  })

		//   var sound = new Howl({
		// 	src: ['Travis Scott - SICKO MODE ft. Drake-6ONRf7h3Mdk.aac']
		//   });
		  
		//   sound.play();
		res.send("playing...");
	});

	//app.get('/listRooms',requestHandlers.listRooms)

	var port = 8081;
	if(process.platform === "linux"){
		port = 8081
	}

	server.listen(port);

	//requestHandlers.initializeSockets(io);






	console.log("Server has started on port:" + port);
}

exports.start = start;
